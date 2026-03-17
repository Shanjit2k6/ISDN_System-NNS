'use strict';

const BaseRepository = require('../../utils/BaseRepository');
const { db }         = require('../../config/firebase');

class OrderRepository extends BaseRepository {
  constructor() { super('orders'); }

  async findByCustomer(customerUid) { return this.findWhere('customerUid', customerUid); }
  async findByRdc(rdcId)            { return this.findWhere('rdcId', rdcId); }
  async findByStatus(status)        { return this.findWhere('orderStatus', status); }

  async getOrderWithItems(orderId) {
    const snap = await db.ref(`orders/${orderId}`).once('value');
    return snap.exists() ? snap.val() : null;
  }
}

module.exports = new OrderRepository();
