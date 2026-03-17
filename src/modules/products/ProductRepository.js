'use strict';

const BaseRepository = require('../../utils/BaseRepository');
const { db }         = require('../../config/firebase');

class ProductRepository extends BaseRepository {
  constructor() { super('products'); }

  async findBySku(sku) {
    const results = await this.findWhere('sku', sku);
    return results[0] || null;
  }

  async findByCategory(categoryId) {
    return this.findWhere('categoryId', categoryId);
  }

  async findActive() {
    return this.findWhere('isActive', true);
  }

  // Tier pricing helpers
  async getTierPricingForProduct(productId) {
    const snap = await db.ref('tierPricing').orderByChild('productId').equalTo(productId).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  async getActivePromotions(productId) {
    const now  = new Date().toISOString();
    const snap = await db.ref('promotions')
      .orderByChild('productId').equalTo(productId).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val()).filter(p =>
      p.isActive && p.startDate <= now && p.endDate >= now
    );
  }
}

module.exports = new ProductRepository();
