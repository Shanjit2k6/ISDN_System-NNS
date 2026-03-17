'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./KpiController');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES }  = require('../../constants');

const router = Router();
router.use(verifyToken);

router.get('/dashboard',   ctrl.getDashboard.bind(ctrl));
router.get('/baselines',   requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER), ctrl.getAllBaselines.bind(ctrl));
router.get('/snapshots',   requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER), ctrl.getSnapshots.bind(ctrl));

router.post(
  '/baselines',
  requireRole(ROLES.HO_EXECUTIVE),
  [body('metricName').notEmpty(), body('baselineValue').isNumeric(), body('baselineUnit').notEmpty()],
  validate, ctrl.recordBaseline.bind(ctrl)
);

router.post(
  '/snapshots',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  ctrl.recordSnapshot.bind(ctrl)
);

module.exports = router;
