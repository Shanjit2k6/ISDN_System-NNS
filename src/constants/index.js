// ─────────────────────────────────────────────
//  Single source of truth for all enum-style
//  constant values used across the application.
// ─────────────────────────────────────────────
'use strict';

const ROLES = Object.freeze({
  HO_EXECUTIVE:      'HO_EXECUTIVE',
  RDC_MANAGER:       'RDC_MANAGER',
  RDC_CLERK:         'RDC_CLERK',
  LOGISTICS_OFFICER: 'LOGISTICS_OFFICER',
  SALES_REP:         'SALES_REP',
  DELIVERY_DRIVER:   'DELIVERY_DRIVER',
  CUSTOMER:          'CUSTOMER',
});

// Order Finite State Machine – valid transitions
const ORDER_STATUS = Object.freeze({
  PENDING:    'PENDING',
  CONFIRMED:  'CONFIRMED',
  PICKING:    'PICKING',
  DISPATCHED: 'DISPATCHED',
  DELIVERED:  'DELIVERED',
  INVOICED:   'INVOICED',
  CANCELLED:  'CANCELLED',
});

const ORDER_FSM_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]:    [ORDER_STATUS.CONFIRMED,  ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]:  [ORDER_STATUS.PICKING,    ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PICKING]:    [ORDER_STATUS.DISPATCHED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DISPATCHED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]:  [ORDER_STATUS.INVOICED],
  [ORDER_STATUS.INVOICED]:   [],
  [ORDER_STATUS.CANCELLED]:  [],
});

const DELIVERY_STATUS = Object.freeze({
  ASSIGNED:        'ASSIGNED',
  IN_TRANSIT:      'IN_TRANSIT',
  DELIVERED:       'DELIVERED',
  CANNOT_DELIVER:  'CANNOT_DELIVER',
});

const INVOICE_STATUS = Object.freeze({
  UNPAID:          'UNPAID',
  PARTIAL:         'PARTIAL',
  PAID:            'PAID',
  OVERDUE:         'OVERDUE',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING:         'PENDING',
  COMPLETED:       'COMPLETED',
  FAILED:          'FAILED',
  REFUNDED:        'REFUNDED',
});

const TRANSFER_STATUS = Object.freeze({
  REQUESTED:       'REQUESTED',
  APPROVED:        'APPROVED',
  REJECTED:        'REJECTED',
  IN_TRANSIT:      'IN_TRANSIT',
  COMPLETED:       'COMPLETED',
});

const RETURN_STATUS = Object.freeze({
  REQUESTED:       'REQUESTED',
  APPROVED:        'APPROVED',
  REJECTED:        'REJECTED',
  COMPLETED:       'COMPLETED',
});

const ALERT_STATUS = Object.freeze({
  OPEN:            'OPEN',
  ACKNOWLEDGED:    'ACKNOWLEDGED',
  RESOLVED:        'RESOLVED',
});

const ALERT_TYPE = Object.freeze({
  LOW_STOCK:       'LOW_STOCK',
  OUT_OF_STOCK:    'OUT_OF_STOCK',
});

const OVERRIDE_STATUS = Object.freeze({
  PENDING:         'PENDING',
  APPROVED:        'APPROVED',
  REJECTED:        'REJECTED',
});

const NOTIFICATION_STATUS = Object.freeze({
  UNREAD:          'UNREAD',
  READ:            'READ',
});

const PO_STATUS = Object.freeze({
  DRAFT:           'DRAFT',
  SENT:            'SENT',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED:        'RECEIVED',
  CANCELLED:       'CANCELLED',
});

const RETURN_REASONS = Object.freeze([
  'DAMAGED',
  'SHORT_DELIVERY',
  'WRONG_ITEM',
  'QUALITY_ISSUE',
]);

const CANNOT_DELIVER_REASONS = Object.freeze([
  'CUSTOMER_ABSENT',
  'ADDRESS_NOT_FOUND',
  'REFUSED_DELIVERY',
  'ROAD_INACCESSIBLE',
]);

const MANIFEST_STATUS = Object.freeze({
  PENDING:         'PENDING',
  IN_PROGRESS:     'IN_PROGRESS',
  COMPLETED:       'COMPLETED',
});

const DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE:      'PERCENTAGE',
  FIXED:           'FIXED',
});

const RETURN_WINDOW_DAYS = 7;

module.exports = {
  ROLES,
  ORDER_STATUS,
  ORDER_FSM_TRANSITIONS,
  DELIVERY_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  TRANSFER_STATUS,
  RETURN_STATUS,
  ALERT_STATUS,
  ALERT_TYPE,
  OVERRIDE_STATUS,
  NOTIFICATION_STATUS,
  PO_STATUS,
  RETURN_REASONS,
  CANNOT_DELIVER_REASONS,
  MANIFEST_STATUS,
  DISCOUNT_TYPES,
  RETURN_WINDOW_DAYS,
};
