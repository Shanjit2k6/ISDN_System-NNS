// src/utils/BaseRepository.js
// ─────────────────────────────────────────────
//  Abstract base class for all Firebase RTDB
//  repositories. Provides generic CRUD so each
//  module repository only defines its collection
//  name and any custom queries.
// ─────────────────────────────────────────────
'use strict';

const { db } = require('../config/firebase');

class BaseRepository {
  /**
   * @param {string} collectionName – top-level Firebase RTDB key
   */
  constructor(collectionName) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is abstract and cannot be instantiated directly.');
    }
    this.collectionName = collectionName;
    this.ref = db.ref(collectionName);
  }

  /**
   * Find a single record by its ID.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const snap = await this.ref.child(id).once('value');
    return snap.exists() ? snap.val() : null;
  }

  /**
   * Return all records in the collection.
   * @returns {Promise<object[]>}
   */
  async findAll() {
    const snap = await this.ref.once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  /**
   * Find records where a child field equals a value.
   * @param {string} field
   * @param {*}      value
   * @returns {Promise<object[]>}
   */
  async findWhere(field, value) {
    const snap = await this.ref.orderByChild(field).equalTo(value).once('value');
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  }

  /**
   * Write a new record. Uses push() to let Firebase generate the key,
   * OR uses the provided id as the key.
   * @param {string} id   – record key
   * @param {object} data – record body
   * @returns {Promise<object>}
   */
  async create(id, data) {
    await this.ref.child(id).set(data);
    return data;
  }

  /**
   * Merge-update an existing record.
   * @param {string} id
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async update(id, updates) {
    await this.ref.child(id).update(updates);
    return this.findById(id);
  }

  /**
   * Replace an entire record.
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>}
   */
  async replace(id, data) {
    await this.ref.child(id).set(data);
    return data;
  }

  /**
   * Soft-delete by setting isActive = false.
   * Use hardDelete for actual removal.
   * @param {string} id
   */
  async softDelete(id) {
    await this.ref.child(id).update({ isActive: false });
  }

  /**
   * Hard delete – permanently removes the record.
   * Use sparingly (prefer soft delete for audit purposes).
   * @param {string} id
   */
  async hardDelete(id) {
    await this.ref.child(id).remove();
  }

  /**
   * Run a Firebase transaction on a specific child path.
   * @param {string}   childPath
   * @param {Function} transactionFn – receives current value, returns new value
   */
  async runTransaction(childPath, transactionFn) {
    return this.ref.child(childPath).transaction(transactionFn);
  }
}

module.exports = BaseRepository;
