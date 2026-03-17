'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./DeliveryController');
const { verifyToken, requireRole, requireRdcAccess } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES, CANNOT_DELIVER_REASONS } = require('../../constants');

const router = Router();
router.use(verifyToken);

router.post(
  '/',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER, ROLES.LOGISTICS_OFFICER),
  [body('orderId').notEmpty(), body('driverUid').notEmpty(), body('rdcId').notEmpty()],
  validate, ctrl.create.bind(ctrl)
);

router.get('/my',                         ctrl.getMyDeliveries.bind(ctrl));
router.get('/rdc/:rdcId',  requireRdcAccess, ctrl.getByRdc.bind(ctrl));
router.get('/:deliveryId',                ctrl.getOne.bind(ctrl));

router.patch(
  '/:deliveryId/gps',
  requireRole(ROLES.DELIVERY_DRIVER),
  [body('latitude').isFloat(), body('longitude').isFloat()],
  validate, ctrl.updateGps.bind(ctrl)
);

router.patch('/:deliveryId/confirm',      ctrl.confirm.bind(ctrl));

router.patch(
  '/:deliveryId/cannot-deliver',
  requireRole(ROLES.DELIVERY_DRIVER),
  [body('reason').isIn(CANNOT_DELIVER_REASONS)],
  validate, ctrl.cannotDeliver.bind(ctrl)
);

// Manifests
router.post(
  '/manifests',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.LOGISTICS_OFFICER, ROLES.RDC_MANAGER),
  [body('driverUid').notEmpty(), body('rdcId').notEmpty(), body('deliveryIds').isArray({ min: 1 })],
  validate, ctrl.createManifest.bind(ctrl)
);

router.get('/manifests/:manifestId', ctrl.getManifest.bind(ctrl));

module.exports = router;
