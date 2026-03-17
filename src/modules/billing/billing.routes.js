'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./BillingController');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES, RETURN_REASONS } = require('../../constants');

const router = Router();
router.use(verifyToken);

// Invoices
router.post('/invoices/order/:orderId',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER, ROLES.RDC_CLERK),
  ctrl.createInvoice.bind(ctrl)
);
router.get('/invoices/my',              ctrl.getMyInvoices.bind(ctrl));
router.get('/invoices/:invoiceId',      ctrl.getInvoice.bind(ctrl));

// Payments
router.post(
  '/payments',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER, ROLES.RDC_CLERK, ROLES.DELIVERY_DRIVER, ROLES.CUSTOMER),
  [
    body('invoiceId').notEmpty(),
    body('paymentMethod').notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
  ],
  validate,
  ctrl.recordPayment.bind(ctrl)
);

// Returns
router.post(
  '/returns',
  requireRole(ROLES.CUSTOMER, ROLES.SALES_REP, ROLES.RDC_CLERK),
  [
    body('orderId').notEmpty(),
    body('customerUid').notEmpty(),
    body('returnReason').isIn(RETURN_REASONS),
    body('items').isArray({ min: 1 }),
  ],
  validate,
  ctrl.initiateReturn.bind(ctrl)
);

router.patch(
  '/returns/:returnId/approve',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  ctrl.approveReturn.bind(ctrl)
);

router.get('/returns/my', ctrl.getMyReturns.bind(ctrl));

module.exports = router;
