// src/modules/users/UserController.js
'use strict';

const UserService  = require('./UserService');
const ApiResponse  = require('../../utils/apiResponse');

class UserController {

  async createUser(req, res, next) {
    try {
      const user = await UserService.createUser(req.body, req.user);
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (err) { next(err); }
  }

  async getUser(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.uid);
      return ApiResponse.success(res, user);
    } catch (err) { next(err); }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers();
      return ApiResponse.success(res, users);
    } catch (err) { next(err); }
  }

  async getUsersByRdc(req, res, next) {
    try {
      const users = await UserService.getUsersByRdc(req.params.rdcId);
      return ApiResponse.success(res, users);
    } catch (err) { next(err); }
  }

  async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.uid, req.body, req.user);
      return ApiResponse.success(res, user, 'User updated');
    } catch (err) { next(err); }
  }

  async deactivateUser(req, res, next) {
    try {
      await UserService.deactivateUser(req.params.uid, req.user);
      return ApiResponse.success(res, null, 'User deactivated');
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();
