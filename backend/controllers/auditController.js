// controllers/auditController.js
// View audit logs (admin only)

const pool = require('../db/pool');

/** GET /api/audit/logs?user_id=&action=&from=&to=&page=1&limit=50 */
const getLogs = async (req, res) => {
  try {
    const { user_id, action, entity, from, to, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (user_id) { params.push(user_id); conditions.push(`a.user_id = $${params.length}`); }
    if (action)  { params.push(action);  conditions.push(`a.action = $${params.length}`); }
    if (entity)  { params.push(entity);  conditions.push(`a.entity = $${params.length}`); }
    if (from)    { params.push(from);    conditions.push(`a.created_at >= $${params.length}`); }
    if (to)      { params.push(to);      conditions.push(`a.created_at <= $${params.length}::date + interval '1 day'`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM audit_logs a ${where}`, params
    );

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT a.*
      FROM   audit_logs a
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      logs: result.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getLogs };
