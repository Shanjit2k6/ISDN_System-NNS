'use strict';

const OrderService = require('./OrderService');
const ApiResponse  = require('../../utils/apiResponse');

class OrderController {
  async placeOrder(req, res, next) {
    try { return ApiResponse.created(res, await OrderService.placeOrder(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getOrder(req, res, next) {
    try { return ApiResponse.success(res, await OrderService.getOrder(req.params.orderId)); }
    catch (err) { next(err); }
  }
  async getMyOrders(req, res, next) {
    try { return ApiResponse.success(res, await OrderService.getOrdersByCustomer(req.user.uid)); }
    catch (err) { next(err); }
  }
  async getOrdersByRdc(req, res, next) {
    try { return ApiResponse.success(res, await OrderService.getOrdersByRdc(req.params.rdcId)); }
    catch (err) { next(err); }
  }
  async transition(req, res, next) {
    try {
      const result = await OrderService.transitionStatus(
        req.params.orderId,
        req.body.newStatus,
        { cancellationReason: req.body.cancellationReason },
        req.user
      );
      return ApiResponse.success(res, result, 'Order status updated');
    } catch (err) { next(err); }
  }
}

module.exports = new OrderController();
