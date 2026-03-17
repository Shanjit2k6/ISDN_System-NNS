'use strict';

const { v4: uuidv4 }        = require('uuid');
const { db }                = require('../../config/firebase');
const InventoryRepository   = require('./InventoryRepository');
const auditLogger           = require('../../utils/auditLogger');
const { ALERT_TYPE, ALERT_STATUS } = require('../../constants');

class InventoryService {

  /**
   * Create a new inventory record for a product at an RDC.
   */
  async createInventory({ productId, rdcId, stockQuantity = 0, reorderLevel = 0, reorderQty = 0 }, actorUser) {
    const inventoryId = uuidv4();
    const record = {
      inventoryId,
      productId,
      rdcId,
      stockQuantity,
      reservedQty: 0,
      reorderLevel,
      reorderQty,
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    await InventoryRepository.create(inventoryId, record);

    // Write to inverted index for fast lookup
    await db.ref(`inventoryIndex/${productId}/${rdcId}`).set(inventoryId);

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'INVENTORY_CREATED',
      collectionAffected: 'inventory',
      recordId: inventoryId,
      newValue: record,
    });

    return record;
  }

  async getInventoryByRdc(rdcId) {
    return InventoryRepository.findByRdc(rdcId);
  }

  async getInventoryByProduct(productId) {
    return InventoryRepository.findByProduct(productId);
  }

  async getInventoryRecord(productId, rdcId) {
    const record = await InventoryRepository.findByProductAndRdc(productId, rdcId);
    if (!record) throw Object.assign(new Error('Inventory record not found'), { statusCode: 404 });
    return record;
  }

  /**
   * Manual stock adjustment (damage, receipt, correction).
   * Emits a low-stock alert if stock falls below reorderLevel.
   */
  async adjustStock({ productId, rdcId, delta, reason }, actorUser) {
    const record = await this.getInventoryRecord(productId, rdcId);
    const oldQty = record.stockQuantity;

    const txResult = await InventoryRepository.adjustStock(record.inventoryId, delta);
    if (!txResult.committed) {
      throw Object.assign(new Error(txResult.reason || 'Stock adjustment failed'), { statusCode: 422 });
    }

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'STOCK_ADJUSTED',
      collectionAffected: 'inventory',
      recordId: record.inventoryId,
      oldValue: { stockQuantity: oldQty },
      newValue: { stockQuantity: txResult.newQty, reason },
    });

    // Trigger low-stock alert if applicable
    await this._checkAndRaiseLowStockAlert(record, txResult.newQty);

    return { ...record, stockQuantity: txResult.newQty };
  }

  async updateReorderSettings(productId, rdcId, { reorderLevel, reorderQty }, actorUser) {
    const record = await this.getInventoryRecord(productId, rdcId);
    const updated = await InventoryRepository.update(record.inventoryId, { reorderLevel, reorderQty });

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'REORDER_SETTINGS_UPDATED',
      collectionAffected: 'inventory',
      recordId: record.inventoryId,
      oldValue: { reorderLevel: record.reorderLevel, reorderQty: record.reorderQty },
      newValue: { reorderLevel, reorderQty },
    });

    return updated;
  }

  /**
   * Check stock level and create a LOW_STOCK alert if below reorderLevel.
   */
  async _checkAndRaiseLowStockAlert(record, currentQty) {
    if (currentQty > record.reorderLevel) return;

    const alertType = currentQty === 0 ? ALERT_TYPE.OUT_OF_STOCK : ALERT_TYPE.LOW_STOCK;
    const alertId   = uuidv4();

    const alert = {
      alertId,
      productId:    record.productId,
      rdcId:        record.rdcId,
      alertType,
      currentQty,
      reorderLevel: record.reorderLevel,
      alertStatus:  ALERT_STATUS.OPEN,
      createdAt:    new Date().toISOString(),
      resolvedAt:   '',
    };

    await db.ref(`stockAlerts/${alertId}`).set(alert);
  }

  async getStockAlerts(rdcId, status = null) {
    const snap = await db.ref('stockAlerts').orderByChild('rdcId').equalTo(rdcId).once('value');
    if (!snap.exists()) return [];
    let alerts = Object.values(snap.val());
    if (status) alerts = alerts.filter(a => a.alertStatus === status);
    return alerts;
  }

  async resolveAlert(alertId, actorUser) {
    await db.ref(`stockAlerts/${alertId}`).update({
      alertStatus: ALERT_STATUS.RESOLVED,
      resolvedAt: new Date().toISOString(),
    });

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'STOCK_ALERT_RESOLVED',
      collectionAffected: 'stockAlerts',
      recordId: alertId,
    });
  }
}

module.exports = new InventoryService();
