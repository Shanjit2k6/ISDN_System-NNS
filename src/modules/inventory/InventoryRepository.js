'use strict';

const BaseRepository = require('../../utils/BaseRepository');
const { db }         = require('../../config/firebase');

class InventoryRepository extends BaseRepository {
  constructor() {
    super('inventory');
  }

  async findByProduct(productId) {
    return this.findWhere('productId', productId);
  }

  async findByRdc(rdcId) {
    return this.findWhere('rdcId', rdcId);
  }

  /**
   * Lookup inventoryId using the inverted index for O(1) lookup.
   * inventoryIndex/{productId}/{rdcId} = inventoryId
   */
  async findInventoryId(productId, rdcId) {
    const snap = await db.ref(`inventoryIndex/${productId}/${rdcId}`).once('value');
    return snap.exists() ? snap.val() : null;
  }

  async findByProductAndRdc(productId, rdcId) {
    const inventoryId = await this.findInventoryId(productId, rdcId);
    if (!inventoryId) return null;
    return this.findById(inventoryId);
  }

  /**
   * Atomically adjust stock quantity using a Firebase transaction.
   * Prevents race conditions when multiple clerks adjust the same SKU.
   */
  async adjustStock(inventoryId, delta) {
    let result;
    await this.runTransaction(inventoryId, (current) => {
      if (!current) return current; // abort if record missing
      const newQty = (current.stockQuantity || 0) + delta;
      if (newQty < 0) {
        result = { committed: false, reason: 'Insufficient stock' };
        return; // abort transaction
      }
      current.stockQuantity = newQty;
      current.version       = (current.version || 0) + 1;
      current.lastUpdated   = new Date().toISOString();
      result = { committed: true, newQty };
      return current;
    });
    return result;
  }

  /**
   * Reserve stock (soft-lock) for a pending transfer or order.
   */
  async reserveStock(inventoryId, qty) {
    return this.adjustReserved(inventoryId, qty);
  }

  async releaseReserved(inventoryId, qty) {
    return this.adjustReserved(inventoryId, -qty);
  }

  async adjustReserved(inventoryId, delta) {
    await this.runTransaction(inventoryId, (current) => {
      if (!current) return current;
      current.reservedQty = Math.max(0, (current.reservedQty || 0) + delta);
      current.lastUpdated = new Date().toISOString();
      return current;
    });
  }
}

module.exports = new InventoryRepository();
