// controllers/salesController.js
// Processes sales transactions, deducts stock, records accounting entries

const pool = require('../db/pool');

/**
 * POST /api/sales
 * Body: {
 *   items: [{ product_id, quantity }],
 *   payment_method: 'cash'|'card'|'ewallet',
 *   amount_tendered: number,   // for cash
 *   discount: number,
 *   notes: string
 * }
 * 
 * This is wrapped in a DB transaction so either everything succeeds or nothing.
 */
const processSale = async (req, res) => {
  const { items, payment_method, amount_tendered, discount = 0, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in cart' });
  }
  if (!['cash', 'card', 'ewallet'].includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const TAX_RATE = parseFloat(process.env.TAX_RATE) || 0;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // --- 1. Fetch product details + recipes ---
    const productIds = items.map(i => i.product_id);
    const productsRes = await client.query(
      `SELECT p.id, p.name, p.price
       FROM products p
       WHERE p.id = ANY($1) AND p.is_available = TRUE`,
      [productIds]
    );
    const productMap = {};
    productsRes.rows.forEach(p => { productMap[p.id] = p; });

    // Validate all products exist
    for (const item of items) {
      if (!productMap[item.product_id]) {
        throw new Error(`Product ${item.product_id} not found or unavailable`);
      }
    }

    // --- 2. Calculate totals ---
    let subtotal = 0;
    for (const item of items) {
      subtotal += productMap[item.product_id].price * item.quantity;
    }
    const discountAmt  = parseFloat(discount) || 0;
    const taxable      = subtotal - discountAmt;
    const tax_amount   = parseFloat((taxable * TAX_RATE).toFixed(2));
    const total_amount = parseFloat((taxable + tax_amount).toFixed(2));
    const change_due   = payment_method === 'cash'
                           ? Math.max(0, (amount_tendered || 0) - total_amount)
                           : 0;

    // --- 3. Generate sale number: TXN-YYYYMMDD-XXXX ---
    const today     = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countRes  = await client.query(
      `SELECT COUNT(*) FROM sales WHERE created_at::date = CURRENT_DATE`
    );
    const seq = String(parseInt(countRes.rows[0].count) + 1).padStart(4, '0');
    const sale_number = `TXN-${today}-${seq}`;

    // --- 4. Insert sale header ---
    const saleRes = await client.query(
      `INSERT INTO sales
         (sale_number, cashier_id, subtotal, discount, tax_amount,
          total_amount, payment_method, amount_tendered, change_due, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        sale_number, req.user.id, subtotal, discountAmt, tax_amount,
        total_amount, payment_method,
        payment_method === 'cash' ? amount_tendered : null,
        change_due, notes || null
      ]
    );
    const sale = saleRes.rows[0];

    // --- 5. Insert sale items ---
    for (const item of items) {
      const product   = productMap[item.product_id];
      const itemTotal = parseFloat((product.price * item.quantity).toFixed(2));
      await client.query(
        `INSERT INTO sale_items
           (sale_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [sale.id, product.id, product.name, product.price, item.quantity, itemTotal]
      );
    }

    // --- 6. Deduct ingredients from stock (recipe-based) ---
    const ingredientDeductions = {};  // ingredient_id → total qty to deduct

    for (const item of items) {
      const recipeRes = await client.query(
        `SELECT ingredient_id, quantity FROM recipes WHERE product_id = $1`,
        [item.product_id]
      );
      for (const r of recipeRes.rows) {
        const total = r.quantity * item.quantity;
        ingredientDeductions[r.ingredient_id] =
          (ingredientDeductions[r.ingredient_id] || 0) + total;
      }
    }

    for (const [ingredientId, qty] of Object.entries(ingredientDeductions)) {
      // Lock row to prevent race conditions between concurrent orders
      const stockRes = await client.query(
        `SELECT name, stock_qty, unit FROM ingredients WHERE id = $1 FOR UPDATE`,
        [ingredientId]
      );
      const ing = stockRes.rows[0];
      if (!ing) throw new Error(`Ingredient ${ingredientId} not found`);
      if (parseFloat(ing.stock_qty) < qty) {
        throw new Error(`Insufficient stock for "${ing.name}": need ${qty}${ing.unit}, only ${ing.stock_qty}${ing.unit} left`);
      }

      // Deduct stock
      await client.query(
        `UPDATE ingredients SET stock_qty = stock_qty - $1 WHERE id = $2`,
        [qty, ingredientId]
      );
      // Log stock movement
      await client.query(
        `INSERT INTO stock_movements
           (ingredient_id, movement_type, quantity_change, notes, sale_id, recorded_by)
         VALUES ($1,'sale_deduction',$2,$3,$4,$5)`,
        [ingredientId, -qty, `Sale ${sale_number}`, sale.id, req.user.id]
      );
    }

    await client.query('COMMIT');

    // --- 7. Emit real-time event for Kitchen Display ---
    const io = req.app.get('io');
    if (io) {
      io.emit('order:new', {
        id: sale.id,
        sale_number,
        order_status: 'pending',
        created_at: sale.created_at,
        notes: notes || null,
        cashier_name: req.user.name,
        items: items.map(item => ({
          product_name: productMap[item.product_id].name,
          quantity: item.quantity,
        })),
      });
    }

    // --- 8. Return full receipt data ---
    const receipt = {
      ...sale,
      items: items.map(item => ({
        ...item,
        product_name: productMap[item.product_id].name,
        unit_price:   productMap[item.product_id].price,
        subtotal:     parseFloat((productMap[item.product_id].price * item.quantity).toFixed(2)),
      })),
      cashier_name: req.user.name,
    };

    res.status(201).json(receipt);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale error:', err);

    if (err.constraint === 'stock_qty_non_negative') {
      return res.status(409).json({ error: 'Insufficient ingredient stock. Another order may have just used the last of it.' });
    }

    const status = err.message?.includes('Insufficient stock') ? 409 : 500;
    res.status(status).json({ error: err.message || 'Failed to process sale' });
  } finally {
    client.release();
  }
};

/** GET /api/sales — list sales with pagination/filtering */
const getSales = async (req, res) => {
  try {
    const { from, to, cashier_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (from) { params.push(from);      conditions.push(`s.created_at >= $${params.length}`); }
    if (to)   { params.push(to);        conditions.push(`s.created_at <= $${params.length}::date + interval '1 day'`); }
    if (cashier_id) { params.push(cashier_id); conditions.push(`s.cashier_id = $${params.length}`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT s.*,
             u.name AS cashier_name
      FROM   sales s
      LEFT JOIN users u ON u.id = s.cashier_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/sales/:id — single sale with items */
const getSale = async (req, res) => {
  try {
    const saleRes = await pool.query(
      `SELECT s.*, u.name AS cashier_name
       FROM sales s LEFT JOIN users u ON u.id = s.cashier_id
       WHERE s.id = $1`, [req.params.id]
    );
    if (!saleRes.rows.length) return res.status(404).json({ error: 'Sale not found' });

    const items = await pool.query(
      `SELECT * FROM sale_items WHERE sale_id = $1`, [req.params.id]
    );

    res.json({ ...saleRes.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { processSale, getSales, getSale };
