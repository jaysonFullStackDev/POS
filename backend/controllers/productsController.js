// controllers/productsController.js
// CRUD for products and categories

const pool = require('../db/pool');

/** GET /api/products — list all products with category info */
const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
             c.name  AS category_name,
             c.color AS category_color
      FROM   products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY c.name, p.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/products/:id — single product with recipe */
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`, [id]
    );
    if (!product.rows.length) return res.status(404).json({ error: 'Not found' });

    const recipe = await pool.query(`
      SELECT r.*, i.name AS ingredient_name, i.unit
      FROM   recipes r
      JOIN   ingredients i ON i.id = r.ingredient_id
      WHERE  r.product_id = $1
    `, [id]);

    res.json({ ...product.rows[0], recipe: recipe.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** POST /api/products — create product */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, recipe } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const p = await client.query(
        `INSERT INTO products (name, description, price, category_id)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [name, description, price, category_id]
      );
      const product = p.rows[0];

      // Insert recipe items if provided
      if (recipe && recipe.length) {
        for (const item of recipe) {
          await client.query(
            `INSERT INTO recipes (product_id, ingredient_id, quantity) VALUES ($1,$2,$3)`,
            [product.id, item.ingredient_id, item.quantity]
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json(product);
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

/** PUT /api/products/:id — update product */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, is_available } = req.body;
    const result = await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, category_id=$4, is_available=$5
       WHERE id=$6 RETURNING *`,
      [name, description, price, category_id, is_available, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** DELETE /api/products/:id */
const deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/categories */
const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };
