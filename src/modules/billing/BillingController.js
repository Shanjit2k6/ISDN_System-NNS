'use strict';

const BillingService = require('./BillingService');
const ApiResponse    = require('../../utils/apiResponse');

class BillingController {
  async createInvoice(req, res, next) {
    try { return ApiResponse.created(res, await BillingService.createInvoice(req.params.orderId, req.user)); }
    catch (err) { next(err); }
  }
  async getInvoice(req, res, next) {
    try { return ApiResponse.success(res, await BillingService.getInvoice(req.params.invoiceId)); }
    catch (err) { next(err); }
  }
  async getMyInvoices(req, res, next) {
    try { return ApiResponse.success(res, await BillingService.getInvoicesByCustomer(req.user.uid)); }
    catch (err) { next(err); }
  }
  async recordPayment(req, res, next) {
    try { return ApiResponse.created(res, await BillingService.recordPayment(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async initiateReturn(req, res, next) {
    try { return ApiResponse.created(res, await BillingService.initiateReturn(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async approveReturn(req, res, next) {
    try { return ApiResponse.success(res, await BillingService.approveReturn(req.params.returnId, req.body, req.user), 'Return approved, credit note issued'); }
    catch (err) { next(err); }
  }
  async getMyReturns(req, res, next) {
    try { return ApiResponse.success(res, await BillingService.getReturnsByCustomer(req.user.uid)); }
    catch (err) { next(err); }
  }
}

module.exports = new BillingController();
