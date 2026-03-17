'use strict';

const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Run after express-validator chains.
 * If there are validation errors, respond with 400.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.badRequest(res, 'Validation failed', errors.array());
  }
  next();
};

module.exports = validate;
