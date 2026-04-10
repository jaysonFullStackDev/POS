// controllers/accountingController.js
// Expenses, P&L report, cash flow, tax summary

const pool = require('../db/pool');

/** POST /api/accounting/expenses */
const createExpense = async (req, res) => {
  try {
    const { category, description, amount, expense_date } = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (category, description, amount, expense_date, recorded_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [category, description, amount, expense_date || new Date(), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/** GET /api/accounting/expenses?from=&to=&category= */
const getExpenses = async (req, res) => {
  try {
    const { from, to, category } = req.query;
    const params = [];
    const conditions = [];

    if (from)     { params.push(from);     conditions.push(`e.expense_date >= $${params.length}`); }
    if (to)       { params.push(to);       conditions.push(`e.expense_date <= $${params.length}`); }
    if (category) { params.push(category); conditions.push(`e.category = $${params.length}`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT e.*, u.name AS recorded_by_name
      FROM   expenses e
      LEFT JOIN users u ON u.id = e.recorded_by
      ${where}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/accounting/pnl?from=&to=
 * Returns a profit & loss summary for the given period.
 */
const getProfitAndLoss = async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = buildDateFilter(from, to);

    // Total revenue from sales
    const revenueRes = await pool.query(`
      SELECT
        COALESCE(SUM(subtotal), 0)    AS gross_sales,
        COALESCE(SUM(discount), 0)    AS total_discounts,
        COALESCE(SUM(tax_amount), 0)  AS total_tax,
        COALESCE(SUM(total_amount), 0) AS net_revenue,
        COUNT(*)                       AS transaction_count
      FROM sales
      ${dateFilter.salesWhere}
    `, dateFilter.params);

    // Total expenses grouped by category
    const expensesRes = await pool.query(`
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      ${dateFilter.expensesWhere}
      GROUP BY category
      ORDER BY total DESC
    `, dateFilter.params);

    const revenue  = revenueRes.rows[0];
    const expenses = expensesRes.rows;
    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.total), 0);
    const grossProfit   = parseFloat(revenue.net_revenue) - totalExpenses;

    res.json({
      period:           { from, to },
      gross_sales:      parseFloat(revenue.gross_sales),
      total_discounts:  parseFloat(revenue.total_discounts),
      total_tax:        parseFloat(revenue.total_tax),
      net_revenue:      parseFloat(revenue.net_revenue),
      transaction_count: parseInt(revenue.transaction_count),
      expenses_by_category: expenses.map(e => ({
        category: e.category,
        total:    parseFloat(e.total),
      })),
      total_expenses: parseFloat(totalExpenses.toFixed(2)),
      gross_profit:   parseFloat(grossProfit.toFixed(2)),
      profit_margin:  revenue.net_revenue > 0
        ? parseFloat(((grossProfit / parseFloat(revenue.net_revenue)) * 100).toFixed(2))
        : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /api/accounting/cashflow?period=monthly&year=2024
 * Returns monthly revenue vs expenses for cash flow chart
 */
const getCashFlow = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const revenueRes = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM created_at) AS month,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM sales
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY month ORDER BY month
    `, [year]);

    const expensesRes = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM expense_date) AS month,
        COALESCE(SUM(amount), 0) AS expenses
      FROM expenses
      WHERE EXTRACT(YEAR FROM expense_date) = $1
      GROUP BY month ORDER BY month
    `, [year]);

    // Merge into 12-month array
    const months = [
      'Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'
    ];
    const revMap = {};
    const expMap = {};
    revenueRes.rows.forEach(r  => { revMap[r.month]  = parseFloat(r.revenue); });
    expensesRes.rows.forEach(e => { expMap[e.month] = parseFloat(e.expenses); });

    const cashflow = months.map((label, i) => {
      const m       = i + 1;
      const revenue  = revMap[m] || 0;
      const expenses = expMap[m] || 0;
      return { month: label, revenue, expenses, net: revenue - expenses };
    });

    res.json({ year: parseInt(year), cashflow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ---- Helper ----
function buildDateFilter(from, to) {
  const params = [];
  const salesConditions    = [];
  const expensesConditions = [];

  if (from) {
    params.push(from);
    salesConditions.push(`created_at >= $${params.length}`);
    expensesConditions.push(`expense_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    salesConditions.push(`created_at <= $${params.length}::date + interval '1 day'`);
    expensesConditions.push(`expense_date <= $${params.length}`);
  }

  return {
    params,
    salesWhere:    salesConditions.length    ? 'WHERE ' + salesConditions.join(' AND ')    : '',
    expensesWhere: expensesConditions.length ? 'WHERE ' + expensesConditions.join(' AND ') : '',
  };
}

module.exports = { createExpense, getExpenses, getProfitAndLoss, getCashFlow };
