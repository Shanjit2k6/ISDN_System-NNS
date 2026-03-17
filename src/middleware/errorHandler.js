'use strict';

const logger      = require('../config/logger');
const ApiResponse = require('../utils/apiResponse');

/**
 * Global Express error handler.
 * Must be registered LAST in app.js (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Express-validator passes arrays of errors via err.array()
  if (typeof err.array === 'function') {
    return ApiResponse.badRequest(res, 'Validation failed', err.array());
  }

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';
  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
