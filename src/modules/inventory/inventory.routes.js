'use strict';

const { Router }                   = require('express');
const { body, query }              = require('express-validator');
const InventoryController          = require('./InventoryController');
const { verifyToken, requireRole, requireRdcAccess } = require('../../middleware/auth');
const validate                     = require('../../middleware/validate');
const { ROLES }                    = require('../../constants');

const router = Router();
router.use(verifyToken);

// POST /api/inventory  – create inventory record for a product/RDC pair
router.post(
  '/',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  [
    body('productId').notEmpty(),
    body('rdcId').notEmpty(),
    body('stockQuantity').isInt({ min: 0 }),
    body('reorderLevel').isInt({ min: 0 }),
  ],
  validate,
  InventoryController.createInventory.bind(InventoryController)
);

// GET /api/inventory/rdc/:rdcId
router.get(
  '/rdc/:rdcId',
  requireRdcAccess,
  InventoryController.getByRdc.bind(InventoryController)
);

// GET /api/inventory/product/:productId
router.get(
  '/product/:productId',
  InventoryController.getByProduct.bind(InventoryController)
);

// PATCH /api/inventory/adjust  – stock adjustment
router.patch(
  '/adjust',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER, ROLES.RDC_CLERK),
  [
    body('productId').notEmpty(),
    body('rdcId').notEmpty(),
    body('delta').isInt(),
    body('reason').notEmpty(),
  ],
  validate,
  InventoryController.adjustStock.bind(InventoryController)
);

// PATCH /api/inventory/reorder/:productId/:rdcId
router.patch(
  '/reorder/:productId/:rdcId',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  InventoryController.updateReorderSettings.bind(InventoryController)
);

// GET /api/inventory/alerts/rdc/:rdcId
router.get(
  '/alerts/rdc/:rdcId',
  requireRdcAccess,
  InventoryController.getAlerts.bind(InventoryController)
);

// PATCH /api/inventory/alerts/:alertId/resolve
router.patch(
  '/alerts/:alertId/resolve',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  InventoryController.resolveAlert.bind(InventoryController)
);

module.exports = router;
