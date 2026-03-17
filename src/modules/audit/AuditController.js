'use strict';

const { db }      = require('../../config/firebase');
const ApiResponse = require('../../utils/apiResponse');

class AuditController {

  /**
   * Return audit log entries, optionally filtered by
   * collectionAffected, recordId, or uid query params.
   */
  async getLogs(req, res, next) {
    try {
      const { collection, recordId, uid, limit = 100 } = req.query;
      let ref = db.ref('auditLog').orderByChild('eventTimestamp').limitToLast(parseInt(limit));

      const snap = await ref.once('value');
      if (!snap.exists()) return ApiResponse.success(res, []);

      let logs = Object.values(snap.val()).reverse(); // newest first

      if (collection) logs = logs.filter(l => l.collectionAffected === collection);
      if (recordId)   logs = logs.filter(l => l.recordId === recordId);
      if (uid)        logs = logs.filter(l => l.uid === uid);

      return ApiResponse.success(res, logs, 'OK', 200, { count: logs.length });
    } catch (err) { next(err); }
  }

  async getLogById(req, res, next) {
    try {
      const snap = await db.ref(`auditLog/${req.params.auditId}`).once('value');
      if (!snap.exists()) return ApiResponse.notFound(res, 'Audit entry not found');
      return ApiResponse.success(res, snap.val());
    } catch (err) { next(err); }
  }
}

module.exports = new AuditController();
