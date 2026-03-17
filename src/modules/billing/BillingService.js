'use strict';

const { v4: uuidv4 } = require('uuid');
const { db }         = require('../../config/firebase');
const auditLogger    = require('../../utils/auditLogger');
const {
  INVOICE_STATUS,
  PAYMENT_STATUS,
  RETURN_STATUS,
  RETURN_REASONS,
  RETURN_WINDOW_DAYS,
} = require('../../constants');
const { differenceInDays } = require('date-fns');

class BillingService {

  // ─── Invoice ──────────────────────────────────────────────────
  async createInvoice(orderId, actorUser) {
    const orderSnap = await db.ref(`orders/${orderId}`).once('value');
    if (!orderSnap.exists()) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    const order = orderSnap.val();

    const invoiceId     = uuidv4();
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate   = new Date().toISOString();
    const dueDate       = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const invoice = {
      invoiceId,
      orderId,
      customerUid:   order.customerUid,
      invoiceNumber,
      invoiceDate,
      dueDate,
      totalAmount:   order.totalAmount,
      paidAmount:    0,
      invoiceStatus: INVOICE_STATUS.UNPAID,
    };

    await db.ref(`invoices/${invoiceId}`).set(invoice);

    await auditLogger.log({
      uid: actorUser?.uid || 'SYSTEM', userRole: actorUser?.roleId || 'SYSTEM',
      actionType: 'INVOICE_CREATED', collectionAffected: 'invoices',
      recordId: invoiceId, newValue: invoice,
    });

    return invoice;
  }

  async getInvoice(invoiceId) {
    const snap = await db.ref(`invoices/${invoiceId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    return snap.val();
  }

  async getInvoicesByCustomer(customerUid) {
    const snap = await db.ref('invoices').orderByChild('customerUid').equalTo(customerUid).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  // ─── Payment ──────────────────────────────────────────────────
  /**
   * Record a payment. Supports online (token/gateway) and manual (cash/cheque).
   */
  async recordPayment({ invoiceId, paymentMethod, amount, paymentToken = '', gatewayRef = '', collectedByUid = '' }, actorUser) {
    const invoice = await this.getInvoice(invoiceId);
    const paymentId = uuidv4();

    const payment = {
      paymentId,
      invoiceId,
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      amount:        parseFloat(amount),
      paymentToken,
      gatewayRef,
      paymentDate:   new Date().toISOString(),
      collectedByUid: collectedByUid || actorUser.uid,
    };

    await db.ref(`payments/${paymentId}`).set(payment);

    // Update invoice paid amount and status
    const newPaid = (invoice.paidAmount || 0) + parseFloat(amount);
    let newStatus = INVOICE_STATUS.PARTIAL;
    if (newPaid >= invoice.totalAmount) newStatus = INVOICE_STATUS.PAID;

    await db.ref(`invoices/${invoiceId}`).update({
      paidAmount:    newPaid,
      invoiceStatus: newStatus,
    });

    // Reduce customer outstanding amount
    await db.ref(`customerProfiles/${invoice.customerUid}`).transaction(profile => {
      if (!profile) return profile;
      profile.outstandingAmt = Math.max(0, (profile.outstandingAmt || 0) - parseFloat(amount));
      return profile;
    });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'PAYMENT_RECORDED', collectionAffected: 'payments',
      recordId: paymentId, newValue: payment,
    });

    return payment;
  }

  // ─── Returns & Credit Notes ───────────────────────────────────
  async initiateReturn({ orderId, customerUid, returnReason, items }, actorUser) {
    // Validate return reason
    if (!RETURN_REASONS.includes(returnReason)) {
      throw Object.assign(new Error('Invalid return reason'), { statusCode: 400 });
    }

    // Enforce 7-day return window
    const orderSnap = await db.ref(`orders/${orderId}`).once('value');
    if (!orderSnap.exists()) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
    const order = orderSnap.val();

    const deliveredAt = order.updatedAt || order.createdAt;
    if (differenceInDays(new Date(), new Date(deliveredAt)) > RETURN_WINDOW_DAYS) {
      throw Object.assign(new Error('Return window of 7 days has expired'), { statusCode: 422 });
    }

    const returnId    = uuidv4();
    const returnItems = {};
    items.forEach(item => {
      const returnItemId = uuidv4();
      returnItems[returnItemId] = { returnItemId, productId: item.productId, returnQty: item.quantity };
    });

    const returnRecord = {
      returnId,
      orderId,
      customerUid,
      initiatedByUid:  actorUser.uid,
      returnReason,
      returnStatus:    RETURN_STATUS.REQUESTED,
      approvedByUid:   '',
      approvalComment: '',
      createdAt:       new Date().toISOString(),
      items:           returnItems,
    };

    await db.ref(`returns/${returnId}`).set(returnRecord);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'RETURN_INITIATED', collectionAffected: 'returns',
      recordId: returnId, newValue: returnRecord,
    });

    return returnRecord;
  }

  async approveReturn(returnId, { approvalComment }, actorUser) {
    const snap = await db.ref(`returns/${returnId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Return not found'), { statusCode: 404 });
    const ret = snap.val();

    await db.ref(`returns/${returnId}`).update({
      returnStatus:   RETURN_STATUS.APPROVED,
      approvedByUid:  actorUser.uid,
      approvalComment: approvalComment || '',
    });

    // Auto-generate credit note
    const creditNote = await this._issueCreditNote(ret, actorUser);

    // Restore stock at originating RDC
    const InventoryRepository = require('../inventory/InventoryRepository');
    for (const item of Object.values(ret.items)) {
      const invRecord = await InventoryRepository.findByProductAndRdc(item.productId, ret.rdcId || '');
      if (invRecord) {
        await InventoryRepository.adjustStock(invRecord.inventoryId, item.returnQty);
      }
    }

    return creditNote;
  }

  async _issueCreditNote(returnRecord, actorUser) {
    // Calculate credit amount from order items
    const orderSnap = await db.ref(`orders/${returnRecord.orderId}`).once('value');
    const order     = orderSnap.val();
    let creditAmount = 0;

    for (const retItem of Object.values(returnRecord.items)) {
      const orderItem = Object.values(order.items || {}).find(i => i.productId === retItem.productId);
      if (orderItem) creditAmount += orderItem.unitPrice * retItem.returnQty;
    }

    // Find linked invoice
    const invSnap = await db.ref('invoices').orderByChild('orderId').equalTo(returnRecord.orderId).once('value');
    const invoiceId = invSnap.exists() ? Object.keys(invSnap.val())[0] : '';

    const creditNoteId = uuidv4();
    const creditNote = {
      creditNoteId,
      returnId:     returnRecord.returnId,
      invoiceId,
      customerUid:  returnRecord.customerUid,
      creditNoteNo: `CN-${Date.now()}`,
      creditAmount: parseFloat(creditAmount.toFixed(2)),
      issuedAt:     new Date().toISOString(),
      applied:      false,
    };

    await db.ref(`creditNotes/${creditNoteId}`).set(creditNote);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'CREDIT_NOTE_ISSUED', collectionAffected: 'creditNotes',
      recordId: creditNoteId, newValue: creditNote,
    });

    return creditNote;
  }

  async getReturnsByCustomer(customerUid) {
    const snap = await db.ref('returns').orderByChild('customerUid').equalTo(customerUid).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }
}

module.exports = new BillingService();
