// controllers/inventoryController.js
// Manage ingredients, stock levels, movements, and suppliers

const pool = require('../db/pool');

/** GET /api/inventory/ingredients */
const getIngredients = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*,
             s.name AS supplier_name,
             CASE WHEN i.stock_qty <= i.low_stock_alert THEN TRUE ELSE FALSE END AS is_low_stock
      FROM   ingredients i
      LEFT JOIN suppliers s ON s.id = i.supplier_id
      ORDER BY i.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** POST /api/inventory/ingredients */
const createIngredient = async (req, res) => {
  try {
    const { name, unit, stock_qty = 0, low_stock_alert = 100, cost_per_unit = 0, supplier_id } = req.body;
    const result = await pool.query(
      `INSERT INTO ingredients (name, unit, stock_qty, low_stock_alert, cost_per_unit, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, unit, stock_qty, low_stock_alert, cost_per_unit, supplier_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** PUT /api/inventory/ingredients/:id */
const updateIngredient = async (req, res) => {
  try {
    const { name, unit, low_stock_alert, cost_per_unit, supplier_id } = req.body;
    const result = await pool.query(
      `UPDATE ingredients
       SET name=$1, unit=$2, low_stock_alert=$3, cost_per_unit=$4, supplier_id=$5
       WHERE id=$6 RETURNING *`,
      [name, unit, low_stock_alert, cost_per_unit, supplier_id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/inventory/stock-movement
 * Adjust stock: purchase, wastage, or manual adjustment
 * Body: { ingredient_id, movement_type, quantity_change, notes }
 */
const addStockMovement = async (req, res) => {
  try {
    const { ingredient_id, movement_type, quantity_change, notes } = req.body;

    if (!['purchase', 'wastage', 'adjustment'].includes(movement_type)) {
      return res.status(400).json({ error: 'Invalid movement_type' });
    }

    // Determine signed qty: wastage is always negative
    const signedQty = movement_type === 'wastage'
      ? -Math.abs(quantity_change)
      : parseFloat(quantity_change);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update stock
      await client.query(
        `UPDATE ingredients SET stock_qty = stock_qty + $1 WHERE id = $2`,
        [signedQty, ingredient_id]
      );

      // Record movement
      const moveRes = await client.query(
        `INSERT INTO stock_movements
           (ingredient_id, movement_type, quantity_change, notes, recorded_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [ingredient_id, movement_type, signedQty, notes || null, req.user.id]
      );

      // Fetch updated ingredient
      const ingRes = await client.query(
        `SELECT *, stock_qty <= low_stock_alert AS is_low_stock
         FROM ingredients WHERE id=$1`, [ingredient_id]
      );

      await client.query('COMMIT');
      res.status(201).json({
        movement:   moveRes.rows[0],
        ingredient: ingRes.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/inventory/movements?ingredient_id=&limit=50 */
const getStockMovements = async (req, res) => {
  try {
    const { ingredient_id, limit = 100 } = req.query;
    const params = [];
    let where = '';

    if (ingredient_id) {
      params.push(ingredient_id);
      where = `WHERE sm.ingredient_id = $1`;
    }

    params.push(parseInt(limit));
    const result = await pool.query(`
      SELECT sm.*,
             i.name AS ingredient_name,
             i.unit,
             u.name AS recorded_by_name
      FROM   stock_movements sm
      JOIN   ingredients i ON i.id = sm.ingredient_id
      LEFT JOIN users u ON u.id = sm.recorded_by
      ${where}
      ORDER BY sm.created_at DESC
      LIMIT $${params.length}
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/inventory/low-stock */
const getLowStockAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, (low_stock_alert - stock_qty) AS deficit
      FROM   ingredients
      WHERE  stock_qty <= low_stock_alert
      ORDER BY deficit DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/inventory/suppliers */
const getSuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

/** POST /api/inventory/suppliers */
const createSupplier = async (req, res) => {
  try {
    const { name, contact, phone, email, address, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact, phone, email, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, contact, phone, email, address, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getIngredients, createIngredient, updateIngredient,
  addStockMovement, getStockMovements, getLowStockAlerts,
  getSuppliers, createSupplier
};
