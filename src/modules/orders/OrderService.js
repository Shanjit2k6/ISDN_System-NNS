'use strict';

const { v4: uuidv4 }      = require('uuid');
const { db }              = require('../../config/firebase');
const OrderRepository     = require('./OrderRepository');
const InventoryRepository = require('../inventory/InventoryRepository');
const ProductService      = require('../products/ProductService');
const auditLogger         = require('../../utils/auditLogger');
const {
  ORDER_STATUS,
  ORDER_FSM_TRANSITIONS,
  ROLES,
} = require('../../constants');

class OrderService {

  // ─── Place Order ─────────────────────────────────────────────
  /**
   * Full order placement flow:
   *  1. Resolve per-item price via pricing engine
   *  2. Check inventory availability
   *  3. Enforce customer credit limit
   *  4. Enforce RDC order cut-off time
   *  5. Reserve stock
   *  6. Write order to DB
   */
  async placeOrder({ customerUid, rdcId, items }, actorUser) {
    // Load customer profile
    const custSnap = await db.ref(`customerProfiles/${customerUid}`).once('value');
    if (!custSnap.exists()) throw Object.assign(new Error('Customer profile not found'), { statusCode: 404 });
    const customer = custSnap.val();

    // Load RDC for cut-off check
    const rdcSnap = await db.ref(`rdcs/${rdcId}`).once('value');
    if (!rdcSnap.exists()) throw Object.assign(new Error('RDC not found'), { statusCode: 404 });
    const rdc = rdcSnap.val();

    // Cut-off time check
    const placedAfterCutOff = this._isAfterCutOff(rdc.orderCutOffTime);
    const scheduledDelivDate = this._computeDeliveryDate(placedAfterCutOff);

    // Build order items with resolved prices
    let totalAmount = 0;
    const resolvedItems = {};

    for (const item of items) {
      const { productId, quantity } = item;

      // Price resolution
      const priceResult = await ProductService.resolvePrice(productId, customer.tierId, quantity);
      const unitPrice   = priceResult.unitPrice;

      // Stock availability check
      const invRecord = await InventoryRepository.findByProductAndRdc(productId, rdcId);
      if (!invRecord) throw Object.assign(new Error(`No inventory record for product ${productId} at RDC ${rdcId}`), { statusCode: 422 });

      const available = invRecord.stockQuantity - invRecord.reservedQty;
      if (available < quantity) {
        throw Object.assign(
          new Error(`Insufficient stock for product ${productId}. Available: ${available}, Requested: ${quantity}`),
          { statusCode: 422 }
        );
      }

      const orderItemId = uuidv4();
      const lineTotal   = unitPrice * quantity;
      totalAmount      += lineTotal;

      resolvedItems[orderItemId] = {
        orderItemId,
        productId,
        quantity,
        unitPrice,
        discountAmt: 0,
      };
    }

    // Credit limit enforcement
    const totalExposure = (customer.outstandingAmt || 0) + totalAmount;
    if (totalExposure > customer.creditLimit) {
      throw Object.assign(
        new Error(`Order value LKR ${totalAmount.toFixed(2)} would exceed credit limit. Outstanding: LKR ${customer.outstandingAmt}, Limit: LKR ${customer.creditLimit}`),
        { statusCode: 422, code: 'CREDIT_LIMIT_EXCEEDED' }
      );
    }

    // Create order record
    const orderId = uuidv4();
    const order = {
      orderId,
      customerUid,
      rdcId,
      orderDate:           new Date().toISOString(),
      orderStatus:         ORDER_STATUS.PENDING,
      totalAmount:         parseFloat(totalAmount.toFixed(2)),
      cancellationReason:  '',
      placedAfterCutOff,
      scheduledDelivDate,
      createdAt:           new Date().toISOString(),
      items:               resolvedItems,
    };

    await OrderRepository.create(orderId, order);

    // Reserve stock for each item
    for (const item of items) {
      const invRecord = await InventoryRepository.findByProductAndRdc(item.productId, rdcId);
      await InventoryRepository.reserveStock(invRecord.inventoryId, item.quantity);
    }

    // Update customer outstanding amount
    await db.ref(`customerProfiles/${customerUid}`).update({
      outstandingAmt: totalExposure,
    });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'ORDER_PLACED', collectionAffected: 'orders',
      recordId: orderId, newValue: order,
    });

    return order;
  }

  // ─── FSM Transition ──────────────────────────────────────────
  async transitionStatus(orderId, newStatus, { cancellationReason } = {}, actorUser) {
    const order = await OrderRepository.getOrderWithItems(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

    const allowed = ORDER_FSM_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw Object.assign(
        new Error(`Invalid transition: ${order.orderStatus} → ${newStatus}`),
        { statusCode: 422 }
      );
    }

    const updates = { orderStatus: newStatus };
    if (newStatus === ORDER_STATUS.CANCELLED) {
      updates.cancellationReason = cancellationReason || '';

      // Release reserved stock on cancel
      if (order.items) {
        for (const item of Object.values(order.items)) {
          const invRecord = await InventoryRepository.findByProductAndRdc(item.productId, order.rdcId);
          if (invRecord) await InventoryRepository.releaseReserved(invRecord.inventoryId, item.quantity);
        }
      }
    }

    // On DELIVERED → auto-trigger invoice creation
    if (newStatus === ORDER_STATUS.DELIVERED) {
      updates.orderStatus = ORDER_STATUS.DELIVERED;
      // Invoice creation is handled by BillingService listener in deliveries flow
    }

    await OrderRepository.update(orderId, updates);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'ORDER_STATUS_CHANGED', collectionAffected: 'orders',
      recordId: orderId,
      oldValue: { orderStatus: order.orderStatus },
      newValue: { orderStatus: newStatus },
    });

    return { ...order, ...updates };
  }

  async getOrder(orderId) {
    const order = await OrderRepository.getOrderWithItems(orderId);
    if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    return order;
  }

  async getOrdersByCustomer(customerUid) { return OrderRepository.findByCustomer(customerUid); }
  async getOrdersByRdc(rdcId)            { return OrderRepository.findByRdc(rdcId); }

  // ─── Helpers ─────────────────────────────────────────────────
  _isAfterCutOff(cutOffTime) {
    if (!cutOffTime) return false;
    const now     = new Date();
    const [h, m]  = cutOffTime.split(':').map(Number);
    const cutOff  = new Date();
    cutOff.setHours(h, m, 0, 0);
    return now > cutOff;
  }

  _computeDeliveryDate(isAfterCutOff) {
    const date = new Date();
    date.setDate(date.getDate() + (isAfterCutOff ? 2 : 1));
    // Skip weekends
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    if (date.getDay() === 6) date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
  }
}

module.exports = new OrderService();
