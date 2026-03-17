'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const CreditOverrideService = require('./CreditOverrideService');
const ApiResponse = require('../../utils/apiResponse');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES }  = require('../../constants');

const router = Router();
router.use(verifyToken);

router.post(
  '/',
  requireRole(ROLES.SALES_REP, ROLES.RDC_CLERK, ROLES.RDC_MANAGER),
  [body('customerUid').notEmpty(), body('requestedAmt').isFloat({ min: 1 })],
  validate,
  async (req, res, next) => {
    try { return ApiResponse.created(res, await CreditOverrideService.requestOverride(req.body, req.user)); }
    catch (err) { next(err); }
  }
);

router.patch(
  '/:overrideId/review',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  [body('approve').isBoolean()],
  validate,
  async (req, res, next) => {
    try { return ApiResponse.success(res, await CreditOverrideService.reviewOverride(req.params.overrideId, req.body, req.user)); }
    catch (err) { next(err); }
  }
);

router.get(
  '/pending',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  async (req, res, next) => {
    try { return ApiResponse.success(res, await CreditOverrideService.getPendingOverrides()); }
    catch (err) { next(err); }
  }
);

module.exports = router;
