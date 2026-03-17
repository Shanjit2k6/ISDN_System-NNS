'use strict';

const { v4: uuidv4 } = require('uuid');
const { db }         = require('../../config/firebase');

class KpiService {

  // ─── Baselines ────────────────────────────────────────────────
  async recordBaseline({ metricName, baselineValue, baselineUnit, notes }, actorUser) {
    const baselineId = uuidv4();
    const record = {
      baselineId, metricName,
      baselineValue: parseFloat(baselineValue),
      baselineUnit,
      measuredAt:    new Date().toISOString(),
      notes:         notes || '',
      recordedByUid: actorUser.uid,
    };
    await db.ref(`kpiBaselines/${baselineId}`).set(record);
    return record;
  }

  async getAllBaselines() {
    const snap = await db.ref('kpiBaselines').once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  // ─── Snapshots ────────────────────────────────────────────────
  async recordSnapshot({ rdcId, orderErrorRate, avgOrderToDelivHrs, stockoutCount, onTimeDeliveryRate, reportGenTimeSecs }, actorUser) {
    const snapshotId = uuidv4();
    const record = {
      snapshotId,
      snapshotDate:       new Date().toISOString().split('T')[0],
      rdcId:              rdcId || 'ALL',
      orderErrorRate:     parseFloat(orderErrorRate)     || 0,
      avgOrderToDelivHrs: parseFloat(avgOrderToDelivHrs) || 0,
      stockoutCount:      parseInt(stockoutCount)         || 0,
      onTimeDeliveryRate: parseFloat(onTimeDeliveryRate)  || 0,
      reportGenTimeSecs:  parseFloat(reportGenTimeSecs)   || 0,
      createdAt:          new Date().toISOString(),
    };
    await db.ref(`kpiSnapshots/${snapshotId}`).set(record);
    return record;
  }

  async getSnapshots(rdcId = null) {
    let query = db.ref('kpiSnapshots');
    if (rdcId) {
      const snap = await query.orderByChild('rdcId').equalTo(rdcId).once('value');
      if (!snap.exists()) return [];
      return Object.values(snap.val());
    }
    const snap = await query.once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  // ─── Live Dashboard Aggregates ────────────────────────────────
  async getDashboardSummary(rdcId = null) {
    const [ordersSnap, delivSnap, invSnap] = await Promise.all([
      db.ref('orders').once('value'),
      db.ref('deliveries').once('value'),
      db.ref('stockAlerts').orderByChild('alertStatus').equalTo('OPEN').once('value'),
    ]);

    let orders     = ordersSnap.exists()  ? Object.values(ordersSnap.val())  : [];
    let deliveries = delivSnap.exists()   ? Object.values(delivSnap.val())   : [];
    let openAlerts = invSnap.exists()     ? Object.values(invSnap.val())     : [];

    if (rdcId) {
      orders     = orders.filter(o => o.rdcId === rdcId);
      deliveries = deliveries.filter(d => d.rdcId === rdcId);
      openAlerts = openAlerts.filter(a => a.rdcId === rdcId);
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      totalOrders:          orders.length,
      pendingOrders:        orders.filter(o => o.orderStatus === 'PENDING').length,
      todayOrders:          orders.filter(o => o.orderDate?.startsWith(today)).length,
      deliveriesToday:      deliveries.filter(d => d.estimatedDelivDate === today).length,
      deliveredToday:       deliveries.filter(d => d.actualDelivDate?.startsWith(today)).length,
      openStockAlerts:      openAlerts.length,
      totalRevenue:         orders.filter(o => o.orderStatus === 'INVOICED').reduce((s, o) => s + o.totalAmount, 0),
    };
  }
}

module.exports = new KpiService();
