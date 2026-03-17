'use strict';

const DeliveryService = require('./DeliveryService');
const ApiResponse     = require('../../utils/apiResponse');

class DeliveryController {
  async create(req, res, next) {
    try { return ApiResponse.created(res, await DeliveryService.createDelivery(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async updateGps(req, res, next) {
    try {
      const result = await DeliveryService.updateGps(req.params.deliveryId, req.body, req.user);
      return ApiResponse.success(res, result);
    } catch (err) { next(err); }
  }
  async confirm(req, res, next) {
    try { return ApiResponse.success(res, await DeliveryService.confirmDelivery(req.params.deliveryId, req.body, req.user), 'Delivery confirmed'); }
    catch (err) { next(err); }
  }
  async cannotDeliver(req, res, next) {
    try {
      await DeliveryService.reportCannotDeliver(req.params.deliveryId, req.body.reason, req.user);
      return ApiResponse.success(res, null, 'Reported');
    } catch (err) { next(err); }
  }
  async getOne(req, res, next) {
    try { return ApiResponse.success(res, await DeliveryService.getDelivery(req.params.deliveryId)); }
    catch (err) { next(err); }
  }
  async getMyDeliveries(req, res, next) {
    try { return ApiResponse.success(res, await DeliveryService.getDeliveriesByDriver(req.user.uid)); }
    catch (err) { next(err); }
  }
  async getByRdc(req, res, next) {
    try { return ApiResponse.success(res, await DeliveryService.getDeliveriesByRdc(req.params.rdcId)); }
    catch (err) { next(err); }
  }
  async createManifest(req, res, next) {
    try { return ApiResponse.created(res, await DeliveryService.createManifest(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getManifest(req, res, next) {
    try { return ApiResponse.success(res, await DeliveryService.getManifest(req.params.manifestId)); }
    catch (err) { next(err); }
  }
}

module.exports = new DeliveryController();
