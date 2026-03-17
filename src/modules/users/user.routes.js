'use strict';

const { Router }                  = require('express');
const { body }                    = require('express-validator');
const UserController              = require('./UserController');
const { verifyToken, requireRole } = require('../../middleware/auth');
const validate                    = require('../../middleware/validate');
const { ROLES }                   = require('../../constants');

const router = Router();

// All user routes require authentication
router.use(verifyToken);

// POST /api/users – HO only
router.post(
  '/',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  [
    body('fullName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('roleId').notEmpty(),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  UserController.createUser.bind(UserController)
);

// GET /api/users
router.get(
  '/',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  UserController.getAllUsers.bind(UserController)
);

// GET /api/users/rdc/:rdcId
router.get(
  '/rdc/:rdcId',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  UserController.getUsersByRdc.bind(UserController)
);

// GET /api/users/:uid
router.get(
  '/:uid',
  UserController.getUser.bind(UserController)
);

// PATCH /api/users/:uid
router.patch(
  '/:uid',
  requireRole(ROLES.HO_EXECUTIVE, ROLES.RDC_MANAGER),
  UserController.updateUser.bind(UserController)
);

// DELETE /api/users/:uid (soft)
router.delete(
  '/:uid',
  requireRole(ROLES.HO_EXECUTIVE),
  UserController.deactivateUser.bind(UserController)
);

module.exports = router;
