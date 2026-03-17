'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./ProductController');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate   = require('../../middleware/validate');
const { ROLES }  = require('../../constants');

const router = Router();
router.use(verifyToken);

router.get('/',                   ctrl.getAll.bind(ctrl));
router.get('/promotions',         ctrl.getAllPromotions.bind(ctrl));
router.get('/:productId',         ctrl.getOne.bind(ctrl));
router.get('/:productId/price',   ctrl.resolvePrice.bind(ctrl));

router.post(
  '/',
  requireRole(ROLES.HO_EXECUTIVE),
  [body('sku').notEmpty(), body('productName').notEmpty(), body('baseUnitPrice').isFloat({ min: 0 })],
  validate, ctrl.create.bind(ctrl)
);

router.patch('/:productId', requireRole(ROLES.HO_EXECUTIVE), ctrl.update.bind(ctrl));

router.post(
  '/tier-pricing',
  requireRole(ROLES.HO_EXECUTIVE),
  [body('productId').notEmpty(), body('tierId').notEmpty(), body('unitPrice').isFloat({ min: 0 })],
  validate, ctrl.setTierPricing.bind(ctrl)
);

router.post(
  '/promotions',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  [
    body('promotionName').notEmpty(),
    body('discountType').isIn(['PERCENTAGE', 'FIXED']),
    body('discountValue').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate, ctrl.createPromotion.bind(ctrl)
);

module.exports = router;
