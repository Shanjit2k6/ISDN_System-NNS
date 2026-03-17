// src/services/SocketService.js
// ─────────────────────────────────────────────
//  Real-time event hub using Socket.IO.
//  Clients join rooms keyed by RDC so they only
//  receive updates relevant to them.
//
//  Events emitted:
//    inventory:update   – stock level changed for a product/RDC
//    delivery:gps       – driver GPS location updated
//    order:status       – order FSM state changed
//    notification:new   – new notification pushed to a user
//    alert:stock        – low-stock alert raised
// ─────────────────────────────────────────────
'use strict';

const logger = require('../config/logger');
const { auth } = require('../config/firebase');

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Attach to an existing http.Server and configure Socket.IO.
   * Called once from app.js after the HTTP server is created.
   *
   * @param {import('http').Server} httpServer
   * @param {string[]} corsOrigins
   */
  init(httpServer, corsOrigins = []) {
    const { Server } = require('socket.io');

    this.io = new Server(httpServer, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    // ── Auth Middleware ─────────────────────────────────────────
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Missing auth token'));
        const decoded = await auth.verifyIdToken(token);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    // ── Connection Handler ──────────────────────────────────────
    this.io.on('connection', (socket) => {
      logger.debug(`Socket connected: ${socket.id} (uid: ${socket.user?.uid})`);

      // Client sends their rdcId to join the right room
      socket.on('join:rdc', (rdcId) => {
        socket.join(`rdc:${rdcId}`);
        logger.debug(`Socket ${socket.id} joined room rdc:${rdcId}`);
      });

      // Client joins their personal notification room
      socket.on('join:user', () => {
        socket.join(`user:${socket.user.uid}`);
      });

      // Driver sends GPS updates via socket (low-latency alternative to REST)
      socket.on('driver:gps', ({ deliveryId, latitude, longitude, rdcId }) => {
        const payload = { deliveryId, latitude, longitude, timestamp: new Date().toISOString() };
        // Broadcast to RDC room so logistics staff see live driver position
        this.io.to(`rdc:${rdcId}`).emit('delivery:gps', payload);
      });

      socket.on('disconnect', (reason) => {
        logger.debug(`Socket disconnected: ${socket.id} – ${reason}`);
      });
    });

    logger.info('Socket.IO initialised');
    return this.io;
  }

  // ── Emit helpers called from Services ─────────────────────────

  emitToRdc(rdcId, event, payload) {
    if (!this.io) return;
    this.io.to(`rdc:${rdcId}`).emit(event, payload);
  }

  emitToUser(uid, event, payload) {
    if (!this.io) return;
    this.io.to(`user:${uid}`).emit(event, payload);
  }

  emitGlobal(event, payload) {
    if (!this.io) return;
    this.io.emit(event, payload);
  }

  /**
   * Broadcast an inventory update to all users in an RDC room.
   */
  broadcastInventoryUpdate(rdcId, { productId, stockQuantity, inventoryId }) {
    this.emitToRdc(rdcId, 'inventory:update', { productId, stockQuantity, inventoryId, ts: Date.now() });
  }

  /**
   * Broadcast order status change.
   */
  broadcastOrderStatus(rdcId, { orderId, orderStatus }) {
    this.emitToRdc(rdcId, 'order:status', { orderId, orderStatus, ts: Date.now() });
  }

  /**
   * Push a notification to a specific user's socket room.
   */
  pushNotification(uid, notification) {
    this.emitToUser(uid, 'notification:new', notification);
  }

  /**
   * Broadcast a stock alert to RDC manager room.
   */
  broadcastStockAlert(rdcId, alert) {
    this.emitToRdc(rdcId, 'alert:stock', alert);
  }
}

module.exports = new SocketService();
