'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./OrderController');
const { verifyToken, requireRole, requireRdcAccess } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES, ORDER_STATUS } = require('../../constants');

const router = Router();
router.use(verifyToken);

// POST /api/orders
router.post(
  '/',
  requireRole(ROLES.CUSTOMER, ROLES.SALES_REP, ROLES.RDC_CLERK),
  [
    body('customerUid').notEmpty(),
    body('rdcId').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
  ],
  validate,
  ctrl.placeOrder.bind(ctrl)
);

// GET /api/orders/my
router.get('/my', ctrl.getMyOrders.bind(ctrl));

// GET /api/orders/rdc/:rdcId
router.get('/rdc/:rdcId', requireRdcAccess, ctrl.getOrdersByRdc.bind(ctrl));

// GET /api/orders/:orderId
router.get('/:orderId', ctrl.getOrder.bind(ctrl));

// PATCH /api/orders/:orderId/status
router.patch(
  '/:orderId/status',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER, ROLES.RDC_CLERK, ROLES.LOGISTICS_OFFICER),
  [body('newStatus').isIn(Object.values(ORDER_STATUS))],
  validate,
  ctrl.transition.bind(ctrl)
);

module.exports = router;
