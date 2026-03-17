'use strict';

const { v4: uuidv4 } = require('uuid');
const { db }         = require('../../config/firebase');
const { NOTIFICATION_STATUS } = require('../../constants');

class NotificationService {

  /**
   * Push a notification to a specific user.
   */
  async send({ uid, notificationType, message, relatedCollection = '', relatedId = '' }) {
    const notificationId = uuidv4();
    const notification = {
      notificationId,
      uid,
      notificationType,
      message,
      relatedCollection,
      relatedId,
      status:    NOTIFICATION_STATUS.UNREAD,
      createdAt: new Date().toISOString(),
    };
    await db.ref(`notifications/${notificationId}`).set(notification);
    return notification;
  }

  /**
   * Broadcast a notification to all users matching a role.
   */
  async broadcast({ roleId, notificationType, message, relatedCollection = '', relatedId = '' }) {
    const snap = await db.ref('users').orderByChild('roleId').equalTo(roleId).once('value');
    if (!snap.exists()) return [];
    const users = Object.values(snap.val());
    const sends = users.map(u =>
      this.send({ uid: u.uid, notificationType, message, relatedCollection, relatedId })
    );
    return Promise.all(sends);
  }

  async getForUser(uid) {
    const snap = await db.ref('notifications').orderByChild('uid').equalTo(uid).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async markRead(notificationId, uid) {
    const snap = await db.ref(`notifications/${notificationId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
    if (snap.val().uid !== uid) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    await db.ref(`notifications/${notificationId}`).update({ status: NOTIFICATION_STATUS.READ });
  }

  async markAllRead(uid) {
    const snap = await db.ref('notifications').orderByChild('uid').equalTo(uid).once('value');
    if (!snap.exists()) return;
    const updates = {};
    Object.keys(snap.val()).forEach(id => {
      updates[`${id}/status`] = NOTIFICATION_STATUS.READ;
    });
    await db.ref('notifications').update(updates);
  }
}

module.exports = new NotificationService();
