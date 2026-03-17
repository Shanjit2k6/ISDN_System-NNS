'use strict';

const InventoryService = require('./InventoryService');
const ApiResponse      = require('../../utils/apiResponse');

class InventoryController {

  async createInventory(req, res, next) {
    try {
      const record = await InventoryService.createInventory(req.body, req.user);
      return ApiResponse.created(res, record);
    } catch (err) { next(err); }
  }

  async getByRdc(req, res, next) {
    try {
      const records = await InventoryService.getInventoryByRdc(req.params.rdcId);
      return ApiResponse.success(res, records);
    } catch (err) { next(err); }
  }

  async getByProduct(req, res, next) {
    try {
      const records = await InventoryService.getInventoryByProduct(req.params.productId);
      return ApiResponse.success(res, records);
    } catch (err) { next(err); }
  }

  async adjustStock(req, res, next) {
    try {
      const result = await InventoryService.adjustStock(req.body, req.user);
      return ApiResponse.success(res, result, 'Stock adjusted successfully');
    } catch (err) { next(err); }
  }

  async updateReorderSettings(req, res, next) {
    try {
      const { productId, rdcId } = req.params;
      const result = await InventoryService.updateReorderSettings(productId, rdcId, req.body, req.user);
      return ApiResponse.success(res, result, 'Reorder settings updated');
    } catch (err) { next(err); }
  }

  async getAlerts(req, res, next) {
    try {
      const alerts = await InventoryService.getStockAlerts(req.params.rdcId, req.query.status);
      return ApiResponse.success(res, alerts);
    } catch (err) { next(err); }
  }

  async resolveAlert(req, res, next) {
    try {
      await InventoryService.resolveAlert(req.params.alertId, req.user);
      return ApiResponse.success(res, null, 'Alert resolved');
    } catch (err) { next(err); }
  }
}

module.exports = new InventoryController();
