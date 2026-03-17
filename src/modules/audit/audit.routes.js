'use strict';

const { Router } = require('express');
const ctrl       = require('./AuditController');
const { verifyToken, requireRole } = require('../../middleware/auth');
const { ROLES }  = require('../../constants');

const router = Router();
router.use(verifyToken);

// Audit log is read-only; only HO Executives can access it
router.get('/',           requireRole(ROLES.HO_EXECUTIVE), ctrl.getLogs.bind(ctrl));
router.get('/:auditId',   requireRole(ROLES.HO_EXECUTIVE), ctrl.getLogById.bind(ctrl));

module.exports = router;
