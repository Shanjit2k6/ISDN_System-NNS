// src/utils/auditLogger.js
// ─────────────────────────────────────────────
//  Immutable audit trail with SHA-256 hash
//  chaining. Each entry stores the hash of the
//  previous entry to detect tampering.
// ─────────────────────────────────────────────
'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const logger  = require('../config/logger');

class AuditLogger {
  constructor() {
    this.ref = db.ref('auditLog');
  }

  /**
   * Compute SHA-256 hash of a JSON-stringified object.
   */
  _hash(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }

  /**
   * Retrieve the hash of the most recent audit entry.
   * @returns {Promise<string>}
   */
  async _getPreviousHash() {
    const snap = await this.ref.orderByChild('eventTimestamp').limitToLast(1).once('value');
    if (!snap.exists()) return '0000000000000000'; // genesis hash
    const entries = Object.values(snap.val());
    return entries[0].entryHash || '0000000000000000';
  }

  /**
   * Append an immutable audit log entry.
   *
   * @param {object} params
   * @param {string} params.uid
   * @param {string} params.userRole
   * @param {string} params.actionType   – e.g. 'ORDER_STATUS_CHANGE'
   * @param {string} params.collectionAffected
   * @param {string} params.recordId
   * @param {*}      params.oldValue
   * @param {*}      params.newValue
   * @param {string} params.ipAddress
   */
  async log({ uid, userRole, actionType, collectionAffected, recordId, oldValue = null, newValue = null, ipAddress = '' }) {
    try {
      const auditId      = uuidv4();
      const previousHash = await this._getPreviousHash();
      const eventTimestamp = new Date().toISOString();

      const entry = {
        auditId,
        eventTimestamp,
        uid,
        userRole,
        actionType,
        collectionAffected,
        recordId,
        oldValue: oldValue !== null ? JSON.stringify(oldValue) : '',
        newValue: newValue !== null ? JSON.stringify(newValue) : '',
        ipAddress,
        previousHash,
        entryHash: '', // will fill after computing
      };

      entry.entryHash = this._hash(entry);

      await this.ref.child(auditId).set(entry);
    } catch (err) {
      // Audit logging must never crash the main request
      logger.error('AuditLogger failed:', err);
    }
  }
}

// Export as singleton
module.exports = new AuditLogger();
