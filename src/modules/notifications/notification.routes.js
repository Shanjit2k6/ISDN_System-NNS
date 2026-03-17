'use strict';

const { Router } = require('express');
const ctrl       = require('./NotificationController');
const { verifyToken } = require('../../middleware/auth');

const router = Router();
router.use(verifyToken);

router.get('/',                              ctrl.getMine.bind(ctrl));
router.patch('/:notificationId/read',        ctrl.markRead.bind(ctrl));
router.patch('/read-all',                    ctrl.markAllRead.bind(ctrl));

module.exports = router;
