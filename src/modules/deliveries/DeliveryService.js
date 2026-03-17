'use strict';

const { v4: uuidv4 } = require('uuid');
const { db }         = require('../../config/firebase');
const auditLogger    = require('../../utils/auditLogger');
const {
  DELIVERY_STATUS,
  MANIFEST_STATUS,
  ORDER_STATUS,
  CANNOT_DELIVER_REASONS,
} = require('../../constants');

class DeliveryService {

  // ─── Create Delivery for an Order ────────────────────────────
  async createDelivery({ orderId, driverUid, rdcId, estimatedDelivDate }, actorUser) {
    const deliveryId = uuidv4();
    const delivery = {
      deliveryId,
      orderId,
      driverUid,
      rdcId,
      deliveryStatus:   DELIVERY_STATUS.ASSIGNED,
      estimatedDelivDate,
      actualDelivDate:  '',
      gpsLatitude:      0,
      gpsLongitude:     0,
      lastGpsUpdate:    '',
      podPhotoUrl:      '',
      customerSignature:'',
      cannotDeliverReason: '',
    };

    await db.ref(`deliveries/${deliveryId}`).set(delivery);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'DELIVERY_CREATED', collectionAffected: 'deliveries',
      recordId: deliveryId, newValue: delivery,
    });

    return delivery;
  }

  // ─── GPS Location Update (driver app) ────────────────────────
  async updateGps(deliveryId, { latitude, longitude }, actorUser) {
    const update = {
      gpsLatitude:   latitude,
      gpsLongitude:  longitude,
      lastGpsUpdate: new Date().toISOString(),
      deliveryStatus: DELIVERY_STATUS.IN_TRANSIT,
    };
    await db.ref(`deliveries/${deliveryId}`).update(update);
    return update;
  }

  // ─── Confirm Delivery (POD) ───────────────────────────────────
  async confirmDelivery(deliveryId, { podPhotoUrl, customerSignature, scannedItems }, actorUser) {
    const now = new Date().toISOString();

    await db.ref(`deliveries/${deliveryId}`).update({
      deliveryStatus:   DELIVERY_STATUS.DELIVERED,
      podPhotoUrl:      podPhotoUrl || '',
      customerSignature: customerSignature || '',
      actualDelivDate:  now,
    });

    // Write delivery scans
    if (scannedItems && Array.isArray(scannedItems)) {
      for (const scan of scannedItems) {
        const scanId = uuidv4();
        await db.ref(`deliveryScans/${scanId}`).set({
          scanId,
          deliveryId,
          scannedByUid: actorUser.uid,
          productId:    scan.productId,
          scannedQty:   scan.quantity,
          scanTimestamp: now,
        });
      }
    }

    // Transition linked order to DELIVERED
    const delivSnap = await db.ref(`deliveries/${deliveryId}`).once('value');
    const delivery  = delivSnap.val();
    await db.ref(`orders/${delivery.orderId}`).update({ orderStatus: ORDER_STATUS.DELIVERED });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'DELIVERY_CONFIRMED', collectionAffected: 'deliveries',
      recordId: deliveryId,
    });

    return { deliveryId, deliveryStatus: DELIVERY_STATUS.DELIVERED };
  }

  // ─── Cannot Deliver ───────────────────────────────────────────
  async reportCannotDeliver(deliveryId, reason, actorUser) {
    if (!CANNOT_DELIVER_REASONS.includes(reason)) {
      throw Object.assign(new Error('Invalid cannot-deliver reason'), { statusCode: 400 });
    }
    await db.ref(`deliveries/${deliveryId}`).update({
      deliveryStatus:      DELIVERY_STATUS.CANNOT_DELIVER,
      cannotDeliverReason: reason,
    });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'DELIVERY_CANNOT_DELIVER', collectionAffected: 'deliveries',
      recordId: deliveryId, newValue: { reason },
    });
  }

  // ─── Driver Manifest ──────────────────────────────────────────
  async createManifest({ driverUid, rdcId, manifestDate, deliveryIds }, actorUser) {
    const manifestId = uuidv4();
    const items = {};
    deliveryIds.forEach((deliveryId, idx) => {
      const manifestItemId = uuidv4();
      items[manifestItemId] = {
        manifestItemId,
        deliveryId,
        stopSequence: idx + 1,
        itemStatus: 'PENDING',
      };
    });

    const manifest = {
      manifestId,
      driverUid,
      rdcId,
      manifestDate,
      status:         MANIFEST_STATUS.PENDING,
      totalStops:     deliveryIds.length,
      completedStops: 0,
      createdAt:      new Date().toISOString(),
      items,
    };

    await db.ref(`driverManifests/${manifestId}`).set(manifest);
    return manifest;
  }

  async getManifest(manifestId) {
    const snap = await db.ref(`driverManifests/${manifestId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Manifest not found'), { statusCode: 404 });
    return snap.val();
  }

  async getDelivery(deliveryId) {
    const snap = await db.ref(`deliveries/${deliveryId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Delivery not found'), { statusCode: 404 });
    return snap.val();
  }

  async getDeliveriesByDriver(driverUid) {
    const snap = await db.ref('deliveries').orderByChild('driverUid').equalTo(driverUid).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  async getDeliveriesByRdc(rdcId) {
    const snap = await db.ref('deliveries').orderByChild('rdcId').equalTo(rdcId).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }
}

module.exports = new DeliveryService();
