'use strict';

const { v4: uuidv4 }    = require('uuid');
const { db }            = require('../../config/firebase');
const ProductRepository = require('./ProductRepository');
const auditLogger       = require('../../utils/auditLogger');
const { DISCOUNT_TYPES } = require('../../constants');

class ProductService {

  async createProduct({ sku, productName, categoryId, baseUnitPrice, description }, actorUser) {
    const existing = await ProductRepository.findBySku(sku);
    if (existing) throw Object.assign(new Error(`SKU '${sku}' already exists`), { statusCode: 409 });

    const productId = uuidv4();
    const product = {
      productId, sku, productName, categoryId,
      baseUnitPrice: parseFloat(baseUnitPrice),
      description: description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await ProductRepository.create(productId, product);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'PRODUCT_CREATED',
      collectionAffected: 'products', recordId: productId, newValue: product,
    });

    return product;
  }

  async getAllProducts() { return ProductRepository.findActive(); }

  async getProductById(productId) {
    const p = await ProductRepository.findById(productId);
    if (!p) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
    return p;
  }

  async updateProduct(productId, updates, actorUser) {
    const existing = await this.getProductById(productId);
    const allowed  = ['productName', 'categoryId', 'baseUnitPrice', 'description', 'isActive'];
    const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
    const updated  = await ProductRepository.update(productId, filtered);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'PRODUCT_UPDATED', collectionAffected: 'products',
      recordId: productId, oldValue: existing, newValue: updated,
    });

    return updated;
  }

  // ─── Pricing Engine ──────────────────────────────────────────
  /**
   * Resolve the applicable unit price for a given customer, product, qty, and date.
   * Priority: Active Promotion > Customer Tier Price > Base Price
   *
   * @param {string} productId
   * @param {string} tierId       – from customerProfiles.tierId
   * @param {number} quantity
   * @returns {Promise<{unitPrice, source}>}
   */
  async resolvePrice(productId, tierId, quantity) {
    const product = await this.getProductById(productId);

    // 1. Check active promotions
    const promos = await ProductRepository.getActivePromotions(productId);
    if (promos.length > 0) {
      const promo = promos[0]; // most recently created wins
      let unitPrice = product.baseUnitPrice;
      if (promo.discountType === DISCOUNT_TYPES.PERCENTAGE) {
        unitPrice = product.baseUnitPrice * (1 - promo.discountValue / 100);
      } else if (promo.discountType === DISCOUNT_TYPES.FIXED) {
        unitPrice = Math.max(0, product.baseUnitPrice - promo.discountValue);
      }
      return { unitPrice: parseFloat(unitPrice.toFixed(2)), source: 'PROMOTION', promotionId: promo.promotionId };
    }

    // 2. Check tier pricing (find best matching tier price for qty)
    if (tierId) {
      const tierPrices = await ProductRepository.getTierPricingForProduct(productId);
      const applicable = tierPrices
        .filter(tp => tp.tierId === tierId && quantity >= tp.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity); // highest minQty first

      if (applicable.length > 0) {
        return { unitPrice: applicable[0].unitPrice, source: 'TIER_PRICING' };
      }
    }

    // 3. Fall back to base price
    return { unitPrice: product.baseUnitPrice, source: 'BASE_PRICE' };
  }

  // ─── Tier Pricing CRUD ────────────────────────────────────────
  async setTierPricing({ productId, tierId, minQuantity, unitPrice }, actorUser) {
    const tierPricingId = uuidv4();
    const record = { tierPricingId, productId, tierId, minQuantity, unitPrice };
    await db.ref(`tierPricing/${tierPricingId}`).set(record);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'TIER_PRICING_SET', collectionAffected: 'tierPricing',
      recordId: tierPricingId, newValue: record,
    });

    return record;
  }

  // ─── Promotions ────────────────────────────────────────────────
  async createPromotion({ promotionName, discountType, discountValue, startDate, endDate, productId, categoryId, appliesTo }, actorUser) {
    const promotionId = uuidv4();
    const promo = {
      promotionId, promotionName, discountType,
      discountValue: parseFloat(discountValue),
      startDate, endDate,
      appliesTo: appliesTo || 'PRODUCT',
      categoryId: categoryId || '',
      productId:  productId  || '',
      createdByUid: actorUser.uid,
      isActive: true,
    };

    await db.ref(`promotions/${promotionId}`).set(promo);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'PROMOTION_CREATED', collectionAffected: 'promotions',
      recordId: promotionId, newValue: promo,
    });

    return promo;
  }

  async getAllPromotions() {
    const snap = await db.ref('promotions').once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }
}

module.exports = new ProductService();
