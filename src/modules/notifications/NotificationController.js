'use strict';

const NotificationService = require('./NotificationService');
const ApiResponse         = require('../../utils/apiResponse');

class NotificationController {
  async getMine(req, res, next) {
    try { return ApiResponse.success(res, await NotificationService.getForUser(req.user.uid)); }
    catch (err) { next(err); }
  }
  async markRead(req, res, next) {
    try {
      await NotificationService.markRead(req.params.notificationId, req.user.uid);
      return ApiResponse.success(res, null, 'Marked as read');
    } catch (err) { next(err); }
  }
  async markAllRead(req, res, next) {
    try {
      await NotificationService.markAllRead(req.user.uid);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) { next(err); }
  }
}

module.exports = new NotificationController();
