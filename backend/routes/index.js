// routes/index.js
// Centralises all route definitions

const express = require('express');
const router  = express.Router();

const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const authCtrl      = require('../controllers/authController');
const productsCtrl  = require('../controllers/productsController');
const salesCtrl     = require('../controllers/salesController');
const ordersCtrl    = require('../controllers/ordersController');
const inventoryCtrl = require('../controllers/inventoryController');
const accountingCtrl= require('../controllers/accountingController');
const reportsCtrl   = require('../controllers/reportsController');

// ── Auth ──────────────────────────────────────────────────
router.post('/auth/login',    authCtrl.login);
router.get ('/auth/me',       authenticate, authCtrl.getMe);
router.get ('/auth/users',    authenticate, authorize('admin','manager'), authCtrl.getUsers);
router.post('/auth/users',    authenticate, authorize('admin'), authCtrl.createUser);
router.put ('/auth/change-password', authenticate, authCtrl.changePassword);

// ── Products ──────────────────────────────────────────────
router.get ('/products',      authenticate, productsCtrl.getProducts);
router.get ('/products/:id',  authenticate, productsCtrl.getProduct);
router.post('/products',      authenticate, authorize('admin','manager'), productsCtrl.createProduct);
router.put ('/products/:id',  authenticate, authorize('admin','manager'), productsCtrl.updateProduct);
router.delete('/products/:id',authenticate, authorize('admin'), productsCtrl.deleteProduct);
router.get ('/categories',    authenticate, productsCtrl.getCategories);

// ── Sales / POS ───────────────────────────────────────────
router.post('/sales',         authenticate, salesCtrl.processSale);
router.get ('/sales',         authenticate, salesCtrl.getSales);
router.get ('/sales/:id',     authenticate, salesCtrl.getSale);

// ── Kitchen / Orders ──────────────────────────────────────
router.get  ('/orders/active',      authenticate, ordersCtrl.getActiveOrders);
router.patch('/orders/:id/status',  authenticate, ordersCtrl.updateOrderStatus);

// ── Inventory ─────────────────────────────────────────────
router.get ('/inventory/ingredients',      authenticate, inventoryCtrl.getIngredients);
router.post('/inventory/ingredients',      authenticate, authorize('admin','manager'), inventoryCtrl.createIngredient);
router.put ('/inventory/ingredients/:id',  authenticate, authorize('admin','manager'), inventoryCtrl.updateIngredient);
router.get ('/inventory/low-stock',        authenticate, inventoryCtrl.getLowStockAlerts);
router.post('/inventory/stock-movement',   authenticate, authorize('admin','manager'), inventoryCtrl.addStockMovement);
router.get ('/inventory/movements',        authenticate, inventoryCtrl.getStockMovements);
router.get ('/inventory/suppliers',        authenticate, inventoryCtrl.getSuppliers);
router.post('/inventory/suppliers',        authenticate, authorize('admin','manager'), inventoryCtrl.createSupplier);

// ── Accounting ────────────────────────────────────────────
router.post('/accounting/expenses',        authenticate, authorize('admin','manager'), accountingCtrl.createExpense);
router.get ('/accounting/expenses',        authenticate, authorize('admin','manager'), accountingCtrl.getExpenses);
router.get ('/accounting/pnl',             authenticate, authorize('admin','manager'), accountingCtrl.getProfitAndLoss);
router.get ('/accounting/cashflow',        authenticate, authorize('admin','manager'), accountingCtrl.getCashFlow);

// ── Reports ───────────────────────────────────────────────
router.get ('/reports/sales-summary',      authenticate, reportsCtrl.getSalesSummary);
router.get ('/reports/top-products',       authenticate, reportsCtrl.getTopProducts);
router.get ('/reports/inventory-usage',    authenticate, reportsCtrl.getInventoryUsage);
router.get ('/reports/dashboard',          authenticate, reportsCtrl.getDashboardStats);

module.exports = router;
