'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./TransferController');
const { verifyToken, requireRole, requireRdcAccess } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES }  = require('../../constants');

const router = Router();
router.use(verifyToken);

router.post(
  '/',
  requireRole(ROLES.RDC_CLERK, ROLES.RDC_MANAGER, ROLES.HO_EXECUTIVE),
  [
    body('productId').notEmpty(),
    body('fromRdcId').notEmpty(),
    body('toRdcId').notEmpty(),
    body('requestedQty').isInt({ min: 1 }),
    body('transferReason').notEmpty(),
  ],
  validate, ctrl.request.bind(ctrl)
);

router.patch(
  '/:transferId/review',
  requireRole(ROLES.RDC_MANAGER, ROLES.HO_EXECUTIVE),
  [body('approve').isBoolean()],
  validate, ctrl.review.bind(ctrl)
);

router.patch(
  '/:transferId/complete',
  requireRole(ROLES.RDC_MANAGER, ROLES.HO_EXECUTIVE, ROLES.LOGISTICS_OFFICER),
  ctrl.complete.bind(ctrl)
);

router.get('/rdc/:rdcId', requireRdcAccess, ctrl.getByRdc.bind(ctrl));

module.exports = router;
