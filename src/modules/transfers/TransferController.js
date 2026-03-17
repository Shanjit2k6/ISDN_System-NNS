'use strict';

const TransferService = require('./TransferService');
const ApiResponse     = require('../../utils/apiResponse');

class TransferController {
  async request(req, res, next) {
    try { return ApiResponse.created(res, await TransferService.requestTransfer(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async review(req, res, next) {
    try { return ApiResponse.success(res, await TransferService.reviewTransfer(req.params.transferId, req.body, req.user)); }
    catch (err) { next(err); }
  }
  async complete(req, res, next) {
    try { return ApiResponse.success(res, await TransferService.completeTransfer(req.params.transferId, req.user), 'Transfer completed'); }
    catch (err) { next(err); }
  }
  async getByRdc(req, res, next) {
    try { return ApiResponse.success(res, await TransferService.getTransfersByRdc(req.params.rdcId)); }
    catch (err) { next(err); }
  }
}

module.exports = new TransferController();
