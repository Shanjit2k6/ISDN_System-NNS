// src/app.js
// ─────────────────────────────────────────────
//  ISDN Backend – Express + Socket.IO entry point
//
//  Startup sequence:
//    1. Load env vars
//    2. Initialise Firebase singleton
//    3. Build Express app with all middleware
//    4. Mount API routes
//    5. Attach Socket.IO to HTTP server
//    6. Start listening
// ─────────────────────────────────────────────
'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Internal modules (order matters) ───────────────────────────
const logger = require('./config/logger');
require('./config/firebase');               // initialise Firebase singleton early
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const SocketService = require('./services/SocketService');

// ── Express app ────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (skip in test env)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// Rate limiting – applies to all /api routes
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Trust proxy (required when behind load balancer / Nginx)
app.set('trust proxy', 1);

// ── API routes ─────────────────────────────────────────────────
app.use('/api', routes);

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── HTTP server + Socket.IO ─────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
const httpServer = http.createServer(app);

SocketService.init(httpServer, allowedOrigins);

httpServer.listen(PORT, () => {
  logger.info(`ISDN Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ── Graceful shutdown ───────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received – shutting down gracefully`);
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10 s
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection:', err); process.exit(1); });

module.exports = { app, httpServer };
