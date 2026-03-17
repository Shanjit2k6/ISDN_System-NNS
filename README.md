# ISDN Backend
**IslandLink Sales Distribution Network — Node.js REST API + Socket.IO**

---

## Project Structure

```
isdn-backend/
├── src/
│   ├── app.js                          ← Entry point (Express + Socket.IO)
│   ├── config/
│   │   ├── firebase.js                 ← Firebase Admin SDK singleton
│   │   └── logger.js                   ← Winston logger
│   ├── constants/
│   │   └── index.js                    ← All enums: ROLES, ORDER_STATUS, FSM…
│   ├── middleware/
│   │   ├── auth.js                     ← verifyToken, requireRole, requireRdcAccess
│   │   ├── errorHandler.js             ← Global error handler
│   │   └── validate.js                 ← express-validator runner
│   ├── utils/
│   │   ├── BaseRepository.js           ← Abstract Firebase CRUD base class
│   │   ├── apiResponse.js              ← Standardised JSON response envelope
│   │   └── auditLogger.js              ← Immutable SHA-256 hash-chained audit log
│   ├── services/
│   │   └── SocketService.js            ← Socket.IO real-time event hub
│   ├── routes/
│   │   └── index.js                    ← Central router (mounts all modules)
│   └── modules/
│       ├── users/
│       │   ├── UserRepository.js
│       │   ├── UserService.js
│       │   ├── UserController.js
│       │   ├── user.routes.js
│       │   ├── CreditOverrideService.js
│       │   └── creditOverride.routes.js
│       ├── products/
│       │   ├── ProductRepository.js
│       │   ├── ProductService.js       ← Includes multi-tier pricing engine
│       │   ├── ProductController.js
│       │   └── product.routes.js
│       ├── inventory/
│       │   ├── InventoryRepository.js  ← Atomic transactions, inverted index
│       │   ├── InventoryService.js     ← Low-stock alert trigger
│       │   ├── InventoryController.js
│       │   └── inventory.routes.js
│       ├── orders/
│       │   ├── OrderRepository.js
│       │   ├── OrderService.js         ← FSM, credit check, cut-off enforcement
│       │   ├── OrderController.js
│       │   └── order.routes.js
│       ├── deliveries/
│       │   ├── DeliveryService.js      ← GPS, POD scanning, driver manifest
│       │   ├── DeliveryController.js
│       │   └── delivery.routes.js
│       ├── billing/
│       │   ├── BillingService.js       ← Invoices, payments, returns, credit notes
│       │   ├── BillingController.js
│       │   └── billing.routes.js
│       ├── transfers/
│       │   ├── TransferService.js      ← 3-step RDC stock transfer workflow
│       │   ├── TransferController.js
│       │   └── transfer.routes.js
│       ├── notifications/
│       │   ├── NotificationService.js
│       │   ├── NotificationController.js
│       │   └── notification.routes.js
│       ├── kpi/
│       │   ├── KpiService.js           ← Baselines, snapshots, dashboard aggregates
│       │   ├── KpiController.js
│       │   └── kpi.routes.js
│       └── audit/
│           ├── AuditController.js      ← Read-only; HO Executive access only
│           └── audit.routes.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Configure environment
cp .env.example .env
# Fill in Firebase credentials in .env

# 3. Run in development
npm run dev

# 4. Run in production
npm start
```

---

## Environment Variables

| Variable                  | Description                                  |
|---------------------------|----------------------------------------------|
| `PORT`                    | HTTP port (default 5000)                     |
| `FIREBASE_PROJECT_ID`     | Firebase project ID                          |
| `FIREBASE_CLIENT_EMAIL`   | Service account email                        |
| `FIREBASE_PRIVATE_KEY`    | Service account private key (escaped `\n`)   |
| `FIREBASE_DATABASE_URL`   | Realtime Database URL                        |
| `CORS_ORIGINS`            | Comma-separated allowed origins              |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window in ms (default 900000)     |
| `RATE_LIMIT_MAX`          | Max requests per window (default 100)        |

---

## API Reference

### Base URL: `/api`

| Method | Path                                | Description                             | Roles Allowed                      |
|--------|-------------------------------------|-----------------------------------------|------------------------------------|
| GET    | `/health`                           | Health check                            | Public                             |
| **Users**                                                                                              |
| POST   | `/users`                            | Create user                             | HO_EXECUTIVE, RDC_MANAGER          |
| GET    | `/users`                            | List all users                          | HO_EXECUTIVE, RDC_MANAGER          |
| GET    | `/users/rdc/:rdcId`                 | Users by RDC                            | HO_EXECUTIVE, RDC_MANAGER          |
| GET    | `/users/:uid`                       | Get user                                | Authenticated                      |
| PATCH  | `/users/:uid`                       | Update user                             | HO_EXECUTIVE, RDC_MANAGER          |
| DELETE | `/users/:uid`                       | Deactivate user                         | HO_EXECUTIVE                       |
| **Credit Overrides**                                                                                   |
| POST   | `/credit-overrides`                 | Request credit override                 | SALES_REP, RDC_CLERK, RDC_MANAGER  |
| PATCH  | `/credit-overrides/:id/review`      | Approve/reject override                 | HO_EXECUTIVE, RDC_MANAGER          |
| GET    | `/credit-overrides/pending`         | List pending overrides                  | HO_EXECUTIVE, RDC_MANAGER          |
| **Products & Pricing**                                                                                 |
| GET    | `/products`                         | All active products                     | Authenticated                      |
| POST   | `/products`                         | Create product                          | HO_EXECUTIVE                       |
| PATCH  | `/products/:productId`              | Update product                          | HO_EXECUTIVE                       |
| GET    | `/products/:productId/price`        | Resolve price (tier + promo)            | Authenticated                      |
| POST   | `/products/tier-pricing`            | Set tier pricing                        | HO_EXECUTIVE                       |
| GET    | `/products/promotions`              | List promotions                         | Authenticated                      |
| POST   | `/products/promotions`              | Create promotion                        | HO_EXECUTIVE, RDC_MANAGER          |
| **Inventory**                                                                                          |
| POST   | `/inventory`                        | Create inventory record                 | HO_EXECUTIVE, RDC_MANAGER          |
| GET    | `/inventory/rdc/:rdcId`             | Stock at an RDC                         | RDC Access                         |
| GET    | `/inventory/product/:productId`     | Stock across all RDCs                   | Authenticated                      |
| PATCH  | `/inventory/adjust`                 | Manual stock adjustment                 | RDC_CLERK+                         |
| PATCH  | `/inventory/reorder/:pid/:rdcId`    | Update reorder settings                 | RDC_MANAGER+                       |
| GET    | `/inventory/alerts/rdc/:rdcId`      | Stock alerts for RDC                    | RDC Access                         |
| PATCH  | `/inventory/alerts/:alertId/resolve`| Resolve stock alert                     | RDC_MANAGER+                       |
| **Orders**                                                                                             |
| POST   | `/orders`                           | Place order (with credit + stock check) | CUSTOMER, SALES_REP, RDC_CLERK     |
| GET    | `/orders/my`                        | My orders (customer)                    | Authenticated                      |
| GET    | `/orders/rdc/:rdcId`                | Orders at RDC                           | RDC Access                         |
| GET    | `/orders/:orderId`                  | Get order detail                        | Authenticated                      |
| PATCH  | `/orders/:orderId/status`           | FSM status transition                   | RDC_CLERK+                         |
| **Deliveries**                                                                                         |
| POST   | `/deliveries`                       | Create delivery assignment              | LOGISTICS_OFFICER+                 |
| GET    | `/deliveries/my`                    | Driver's deliveries                     | DELIVERY_DRIVER                    |
| GET    | `/deliveries/rdc/:rdcId`            | RDC deliveries                          | RDC Access                         |
| PATCH  | `/deliveries/:id/gps`               | Update GPS location                     | DELIVERY_DRIVER                    |
| PATCH  | `/deliveries/:id/confirm`           | Confirm delivery (POD)                  | DELIVERY_DRIVER                    |
| PATCH  | `/deliveries/:id/cannot-deliver`    | Report cannot deliver                   | DELIVERY_DRIVER                    |
| POST   | `/deliveries/manifests`             | Create driver manifest                  | LOGISTICS_OFFICER+                 |
| GET    | `/deliveries/manifests/:id`         | Get manifest                            | Authenticated                      |
| **Billing**                                                                                            |
| POST   | `/billing/invoices/order/:orderId`  | Generate invoice for order              | RDC_CLERK+                         |
| GET    | `/billing/invoices/my`              | Customer's invoices                     | Authenticated                      |
| GET    | `/billing/invoices/:invoiceId`      | Get invoice                             | Authenticated                      |
| POST   | `/billing/payments`                 | Record payment                          | RDC_CLERK+, CUSTOMER               |
| POST   | `/billing/returns`                  | Initiate return                         | CUSTOMER, SALES_REP, RDC_CLERK     |
| PATCH  | `/billing/returns/:id/approve`      | Approve return + issue credit note      | RDC_MANAGER+                       |
| GET    | `/billing/returns/my`               | Customer's returns                      | Authenticated                      |
| **Transfers**                                                                                          |
| POST   | `/transfers`                        | Request stock transfer                  | RDC_CLERK+                         |
| PATCH  | `/transfers/:id/review`             | Approve/reject transfer                 | RDC_MANAGER+                       |
| PATCH  | `/transfers/:id/complete`           | Complete transfer (move stock)          | LOGISTICS_OFFICER+                 |
| GET    | `/transfers/rdc/:rdcId`             | Transfers for RDC                       | RDC Access                         |
| **Notifications**                                                                                      |
| GET    | `/notifications`                    | My notifications                        | Authenticated                      |
| PATCH  | `/notifications/:id/read`           | Mark notification read                  | Authenticated                      |
| PATCH  | `/notifications/read-all`           | Mark all read                           | Authenticated                      |
| **KPI & Reporting**                                                                                    |
| GET    | `/kpi/dashboard`                    | Live dashboard summary                  | Authenticated                      |
| GET    | `/kpi/baselines`                    | All KPI baselines                       | HO_EXECUTIVE, RDC_MANAGER          |
| POST   | `/kpi/baselines`                    | Record baseline measurement             | HO_EXECUTIVE                       |
| GET    | `/kpi/snapshots`                    | KPI snapshots                           | HO_EXECUTIVE, RDC_MANAGER          |
| POST   | `/kpi/snapshots`                    | Record KPI snapshot                     | HO_EXECUTIVE, RDC_MANAGER          |
| **Audit Log**                                                                                          |
| GET    | `/audit`                            | Query audit log (read-only)             | HO_EXECUTIVE                       |
| GET    | `/audit/:auditId`                   | Single audit entry                      | HO_EXECUTIVE                       |

---

## Authentication

All protected routes require a Firebase ID token in the header:

```
Authorization: Bearer <firebase-id-token>
```

Obtain this token by signing in via Firebase Auth on the client (Web SDK, Android, iOS).

---

## Real-Time (Socket.IO)

Connect to the server with your Firebase token:

```js
const socket = io('http://localhost:5000', {
  auth: { token: firebaseIdToken }
});

// Join your RDC room to receive inventory + order updates
socket.emit('join:rdc', 'rdc-colombo');

// Join personal notification room
socket.emit('join:user');

// Listen for events
socket.on('inventory:update',  (data) => console.log('Stock changed:', data));
socket.on('order:status',      (data) => console.log('Order update:', data));
socket.on('delivery:gps',      (data) => console.log('Driver location:', data));
socket.on('notification:new',  (data) => console.log('Notification:', data));
socket.on('alert:stock',       (data) => console.log('Low stock alert:', data));

// Driver sends GPS location
socket.emit('driver:gps', { deliveryId, latitude, longitude, rdcId });
```

---

## OOP Design

| Class                | Type          | Responsibility                                    |
|----------------------|---------------|---------------------------------------------------|
| `BaseRepository`     | Abstract      | Generic Firebase CRUD; all repos extend this      |
| `UserRepository`     | Concrete      | User-specific queries (by email, role, RDC)       |
| `ProductRepository`  | Concrete      | SKU lookup, tier pricing, active promotions       |
| `InventoryRepository`| Concrete      | Atomic transactions, stock reservation, index     |
| `OrderRepository`    | Concrete      | Order queries by customer, RDC, status            |
| `*Service`           | Singleton     | Business logic, workflow orchestration            |
| `*Controller`        | Singleton     | HTTP request/response mapping                     |
| `ApiResponse`        | Static helper | Uniform JSON envelope for all responses           |
| `AuditLogger`        | Singleton     | Append-only, SHA-256 hash-chained audit trail     |
| `FirebaseConfig`     | Singleton     | Firebase Admin SDK — init once, share everywhere  |
| `SocketService`      | Singleton     | Socket.IO rooms, auth, real-time event dispatch   |

---

## Key Business Rules Implemented

- **Order FSM** — only valid transitions allowed; invalid ones return HTTP 422
- **Credit limit enforcement** — blocks orders that exceed outstanding + new value
- **Order cut-off time** — auto-assigns next+1 delivery date if after cut-off
- **Pricing engine** — Promotion > Tier Price > Base Price, per (customer, SKU, qty)
- **Stock reservation** — soft-locks reserved qty to prevent double-allocation
- **3-step transfer workflow** — Request → Manager Approval → Complete (with stock movement)
- **7-day return window** — returns rejected after 7 days from delivery
- **Immutable audit log** — SHA-256 hash chaining; cannot be modified or deleted
- **RDC data isolation** — users cannot read/write other RDCs' data (enforced in middleware)
