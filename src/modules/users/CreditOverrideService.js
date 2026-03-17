'use strict';

const { v4: uuidv4 } = require('uuid');
const { db }         = require('../../config/firebase');
const auditLogger    = require('../../utils/auditLogger');
const { OVERRIDE_STATUS } = require('../../constants');

class CreditOverrideService {

  async requestOverride({ customerUid, orderId, requestedAmt }, actorUser) {
    const custSnap = await db.ref(`customerProfiles/${customerUid}`).once('value');
    if (!custSnap.exists()) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    const customer = custSnap.val();

    const overrideId = uuidv4();
    const record = {
      overrideId,
      customerUid,
      requestedByUid:  actorUser.uid,
      approvedByUid:   '',
      orderId:         orderId || '',
      requestedAmt:    parseFloat(requestedAmt),
      existingLimit:   customer.creditLimit,
      overrideStatus:  OVERRIDE_STATUS.PENDING,
      managerComment:  '',
      createdAt:       new Date().toISOString(),
    };

    await db.ref(`creditOverrideRequests/${overrideId}`).set(record);
    return record;
  }

  async reviewOverride(overrideId, { approve, managerComment }, actorUser) {
    const snap = await db.ref(`creditOverrideRequests/${overrideId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Override request not found'), { statusCode: 404 });
    const req = snap.val();

    const newStatus = approve ? OVERRIDE_STATUS.APPROVED : OVERRIDE_STATUS.REJECTED;
    await db.ref(`creditOverrideRequests/${overrideId}`).update({
      overrideStatus:  newStatus,
      approvedByUid:   actorUser.uid,
      managerComment:  managerComment || '',
    });

    // If approved, raise the customer's credit limit temporarily
    if (approve) {
      await db.ref(`customerProfiles/${req.customerUid}`).update({
        creditLimit: req.requestedAmt,
      });

      await auditLogger.log({
        uid: actorUser.uid, userRole: actorUser.roleId,
        actionType: 'CREDIT_LIMIT_OVERRIDE_APPROVED',
        collectionAffected: 'customerProfiles',
        recordId: req.customerUid,
        oldValue: { creditLimit: req.existingLimit },
        newValue: { creditLimit: req.requestedAmt },
      });
    }

    return { overrideId, overrideStatus: newStatus };
  }

  async getPendingOverrides() {
    const snap = await db.ref('creditOverrideRequests')
      .orderByChild('overrideStatus').equalTo(OVERRIDE_STATUS.PENDING).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }
}

module.exports = new CreditOverrideService();
