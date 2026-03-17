// src/routes/index.js
// ─────────────────────────────────────────────
//  Central route registry.
//  All module routers are mounted here and then
//  attached to Express in app.js under /api.
// ─────────────────────────────────────────────
'use strict';

const { Router } = require('express');

const userRoutes          = require('../modules/users/user.routes');
const creditOverrideRoutes= require('../modules/users/creditOverride.routes');
const productRoutes       = require('../modules/products/product.routes');
const inventoryRoutes     = require('../modules/inventory/inventory.routes');
const orderRoutes         = require('../modules/orders/order.routes');
const deliveryRoutes      = require('../modules/deliveries/delivery.routes');
const billingRoutes       = require('../modules/billing/billing.routes');
const transferRoutes      = require('../modules/transfers/transfer.routes');
const notificationRoutes  = require('../modules/notifications/notification.routes');
const kpiRoutes           = require('../modules/kpi/kpi.routes');
const auditRoutes         = require('../modules/audit/audit.routes');

const router = Router();

// ── Health check (unauthenticated) ─────────────────────────────
router.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'ISDN Backend',
  timestamp: new Date().toISOString(),
}));

// ── Module routes ───────────────────────────────────────────────
router.use('/users',            userRoutes);
router.use('/credit-overrides', creditOverrideRoutes);
router.use('/products',         productRoutes);
router.use('/inventory',        inventoryRoutes);
router.use('/orders',           orderRoutes);
router.use('/deliveries',       deliveryRoutes);
router.use('/billing',          billingRoutes);
router.use('/transfers',        transferRoutes);
router.use('/notifications',    notificationRoutes);
router.use('/kpi',              kpiRoutes);
router.use('/audit',            auditRoutes);

module.exports = router;
