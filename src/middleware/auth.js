// ─────────────────────────────────────────────
//  Firebase token verification + role-based
//  access control middleware factory.
// ─────────────────────────────────────────────
'use strict';

const { auth, db } = require('../config/firebase');
const ApiResponse  = require('../utils/apiResponse');
const logger       = require('../config/logger');

/**
 * Verify Firebase ID token from the Authorization header.
 * Attaches decoded token + full user record to req.user.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Missing or malformed Authorization header');
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await auth.verifyIdToken(idToken);

    // Load full user profile from RTDB
    const snap = await db.ref(`users/${decoded.uid}`).once('value');
    if (!snap.exists()) {
      return ApiResponse.unauthorized(res, 'User profile not found');
    }

    const userRecord = snap.val();
    if (!userRecord.isActive) {
      return ApiResponse.forbidden(res, 'Account is deactivated');
    }

    req.user = { ...decoded, ...userRecord };
    next();
  } catch (err) {
    logger.warn(`Token verification failed: ${err.message}`);
    return ApiResponse.unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Role guard factory.
 * Usage: requireRole(ROLES.RDC_MANAGER, ROLES.HO_EXECUTIVE)
 *
 * @param  {...string} allowedRoles
 * @returns Express middleware
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return ApiResponse.unauthorized(res);
  if (!allowedRoles.includes(req.user.roleId)) {
    return ApiResponse.forbidden(res, `Role '${req.user.roleId}' is not permitted to access this resource`);
  }
  next();
};

/**
 * RDC isolation guard.
 * Ensures a user can only access data belonging to their assigned RDC
 * unless they are HO_EXECUTIVE (island-wide visibility).
 *
 * Attach to routes that accept :rdcId in params.
 */
const requireRdcAccess = (req, res, next) => {
  const { ROLES } = require('../constants');
  const { rdcId }  = req.params;

  if (req.user.roleId === ROLES.HO_EXECUTIVE) return next();

  if (req.user.assignedRdcId !== rdcId) {
    return ApiResponse.forbidden(res, 'You do not have access to this RDC\'s data');
  }
  next();
};

module.exports = { verifyToken, requireRole, requireRdcAccess };
