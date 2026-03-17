'use strict';

const { v4: uuidv4 }      = require('uuid');
const { db }              = require('../../config/firebase');
const InventoryRepository = require('../inventory/InventoryRepository');
const auditLogger         = require('../../utils/auditLogger');
const { TRANSFER_STATUS } = require('../../constants');

class TransferService {

  /**
   * Step 1: Clerk creates transfer request + soft-locks stock at source RDC.
   */
  async requestTransfer({ productId, fromRdcId, toRdcId, requestedQty, transferReason }, actorUser) {
    const sourceInv = await InventoryRepository.findByProductAndRdc(productId, fromRdcId);
    if (!sourceInv) throw Object.assign(new Error('Source inventory not found'), { statusCode: 404 });

    const available = sourceInv.stockQuantity - sourceInv.reservedQty;
    if (available < requestedQty) {
      throw Object.assign(new Error(`Only ${available} units available at source RDC`), { statusCode: 422 });
    }

    // Soft-lock quantity at source
    await InventoryRepository.reserveStock(sourceInv.inventoryId, requestedQty);

    const transferId = uuidv4();
    const transfer = {
      transferId, productId, fromRdcId, toRdcId,
      requestedQty, transferReason,
      transferStatus: TRANSFER_STATUS.REQUESTED,
      createdByUid:   actorUser.uid,
      approvedByUid:  '',
      managerComment: '',
      notifiedHO:     false,
      createdAt:      new Date().toISOString(),
      completedAt:    '',
    };

    await db.ref(`stockTransferRequests/${transferId}`).set(transfer);

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'TRANSFER_REQUESTED', collectionAffected: 'stockTransferRequests',
      recordId: transferId, newValue: transfer,
    });

    return transfer;
  }

  /**
   * Step 2: Source RDC Manager approves or rejects.
   */
  async reviewTransfer(transferId, { approve, managerComment }, actorUser) {
    const snap = await db.ref(`stockTransferRequests/${transferId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
    const transfer = snap.val();

    if (transfer.transferStatus !== TRANSFER_STATUS.REQUESTED) {
      throw Object.assign(new Error('Transfer is not in REQUESTED state'), { statusCode: 422 });
    }

    if (!approve) {
      // Release soft-lock on rejection
      const sourceInv = await InventoryRepository.findByProductAndRdc(transfer.productId, transfer.fromRdcId);
      if (sourceInv) await InventoryRepository.releaseReserved(sourceInv.inventoryId, transfer.requestedQty);

      await db.ref(`stockTransferRequests/${transferId}`).update({
        transferStatus: TRANSFER_STATUS.REJECTED,
        approvedByUid:  actorUser.uid,
        managerComment: managerComment || '',
      });

      return { transferId, transferStatus: TRANSFER_STATUS.REJECTED };
    }

    await db.ref(`stockTransferRequests/${transferId}`).update({
      transferStatus: TRANSFER_STATUS.APPROVED,
      approvedByUid:  actorUser.uid,
      managerComment: managerComment || '',
      notifiedHO:     true,
    });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'TRANSFER_APPROVED', collectionAffected: 'stockTransferRequests',
      recordId: transferId,
    });

    return { transferId, transferStatus: TRANSFER_STATUS.APPROVED };
  }

  /**
   * Step 3: Complete – deduct from source, add to destination.
   */
  async completeTransfer(transferId, actorUser) {
    const snap = await db.ref(`stockTransferRequests/${transferId}`).once('value');
    if (!snap.exists()) throw Object.assign(new Error('Transfer not found'), { statusCode: 404 });
    const transfer = snap.val();

    if (transfer.transferStatus !== TRANSFER_STATUS.APPROVED) {
      throw Object.assign(new Error('Transfer must be APPROVED before completing'), { statusCode: 422 });
    }

    const sourceInv = await InventoryRepository.findByProductAndRdc(transfer.productId, transfer.fromRdcId);
    const destInv   = await InventoryRepository.findByProductAndRdc(transfer.productId, transfer.toRdcId);

    if (!sourceInv || !destInv) throw Object.assign(new Error('Inventory record missing at source or destination'), { statusCode: 422 });

    // Deduct from source (also releases reserved)
    await InventoryRepository.adjustStock(sourceInv.inventoryId, -transfer.requestedQty);
    await InventoryRepository.releaseReserved(sourceInv.inventoryId, transfer.requestedQty);

    // Add to destination
    await InventoryRepository.adjustStock(destInv.inventoryId, transfer.requestedQty);

    await db.ref(`stockTransferRequests/${transferId}`).update({
      transferStatus: TRANSFER_STATUS.COMPLETED,
      completedAt:    new Date().toISOString(),
    });

    await auditLogger.log({
      uid: actorUser.uid, userRole: actorUser.roleId,
      actionType: 'TRANSFER_COMPLETED', collectionAffected: 'stockTransferRequests',
      recordId: transferId,
    });

    return { transferId, transferStatus: TRANSFER_STATUS.COMPLETED };
  }

  async getTransfersByRdc(rdcId) {
    const [from, to] = await Promise.all([
      db.ref('stockTransferRequests').orderByChild('fromRdcId').equalTo(rdcId).once('value'),
      db.ref('stockTransferRequests').orderByChild('toRdcId').equalTo(rdcId).once('value'),
    ]);
    const results = {};
    if (from.exists()) Object.assign(results, from.val());
    if (to.exists())   Object.assign(results, to.val());
    return Object.values(results);
  }
}

module.exports = new TransferService();
