'use strict';

const ProductService = require('./ProductService');
const ApiResponse    = require('../../utils/apiResponse');

class ProductController {
  async create(req, res, next) {
    try { return ApiResponse.created(res, await ProductService.createProduct(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await ProductService.getAllProducts()); }
    catch (err) { next(err); }
  }
  async getOne(req, res, next) {
    try { return ApiResponse.success(res, await ProductService.getProductById(req.params.productId)); }
    catch (err) { next(err); }
  }
  async update(req, res, next) {
    try { return ApiResponse.success(res, await ProductService.updateProduct(req.params.productId, req.body, req.user), 'Product updated'); }
    catch (err) { next(err); }
  }
  async resolvePrice(req, res, next) {
    try {
      const { productId } = req.params;
      const { tierId, quantity } = req.query;
      const result = await ProductService.resolvePrice(productId, tierId, parseInt(quantity) || 1);
      return ApiResponse.success(res, result);
    } catch (err) { next(err); }
  }
  async setTierPricing(req, res, next) {
    try { return ApiResponse.created(res, await ProductService.setTierPricing(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async createPromotion(req, res, next) {
    try { return ApiResponse.created(res, await ProductService.createPromotion(req.body, req.user)); }
    catch (err) { next(err); }
  }
  async getAllPromotions(req, res, next) {
    try { return ApiResponse.success(res, await ProductService.getAllPromotions()); }
    catch (err) { next(err); }
  }
}

module.exports = new ProductController();
