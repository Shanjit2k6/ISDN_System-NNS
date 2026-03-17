'use strict';

const KpiService  = require('./KpiService');
const ApiResponse = require('../../utils/apiResponse');

class KpiController {
  async recordBaseline(req, res, next) {
    try { return ApiResponse.created(res, await KpiService.recordBaseline(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getAllBaselines(req, res, next) {
    try { return ApiResponse.success(res, await KpiService.getAllBaselines()); }
    catch (err) { next(err); }
  }
  async recordSnapshot(req, res, next) {
    try { return ApiResponse.created(res, await KpiService.recordSnapshot(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getSnapshots(req, res, next) {
    try { return ApiResponse.success(res, await KpiService.getSnapshots(req.query.rdcId)); }
    catch (err) { next(err); }
  }
  async getDashboard(req, res, next) {
    try { return ApiResponse.success(res, await KpiService.getDashboardSummary(req.query.rdcId)); }
    catch (err) { next(err); }
  }
}

module.exports = new KpiController();
