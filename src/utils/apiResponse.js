// src/utils/apiResponse.js
// ─────────────────────────────────────────────
//  Standardised JSON envelope for all responses.
//  { success, data, message, errors, meta }
// ─────────────────────────────────────────────
'use strict';

class ApiResponse {
  static success(res, data = null, message = 'OK', statusCode = 200, meta = null) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors);
  }

  static forbidden(res, message = 'Access denied') {
    return ApiResponse.error(res, message, 403);
  }

  static unauthorized(res, message = 'Unauthorised') {
    return ApiResponse.error(res, message, 401);
  }

  static conflict(res, message = 'Conflict') {
    return ApiResponse.error(res, message, 409);
  }

  static unprocessable(res, message = 'Unprocessable entity', errors = null) {
    return ApiResponse.error(res, message, 422, errors);
  }
}

module.exports = ApiResponse;
