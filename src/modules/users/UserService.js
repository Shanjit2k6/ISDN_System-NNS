// src/modules/users/UserService.js
'use strict';

const { v4: uuidv4 }    = require('uuid');
const { auth }          = require('../../config/firebase');
const UserRepository    = require('./UserRepository');
const auditLogger       = require('../../utils/auditLogger');
const { ROLES }         = require('../../constants');

class UserService {

  /**
   * Create a new Firebase Auth user + RTDB profile.
   */
  async createUser({ fullName, email, phone, roleId, assignedRdcId, language = 'en', password }, actorUser) {
    // Create auth account
    const firebaseUser = await auth.createUser({ email, password, displayName: fullName });
    const uid = firebaseUser.uid;

    const profile = {
      uid,
      fullName,
      email,
      phone: phone || '',
      roleId,
      assignedRdcId: assignedRdcId || '',
      language,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await UserRepository.create(uid, profile);

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'USER_CREATED',
      collectionAffected: 'users',
      recordId: uid,
      newValue: profile,
    });

    return profile;
  }

  async getUserById(uid) {
    const user = await UserRepository.findById(uid);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  async getAllUsers() {
    return UserRepository.findAll();
  }

  async getUsersByRdc(rdcId) {
    return UserRepository.findByRdc(rdcId);
  }

  async updateUser(uid, updates, actorUser) {
    const existing = await this.getUserById(uid);

    // Prevent role escalation by non-HO users
    if (updates.roleId && actorUser.roleId !== ROLES.HO_EXECUTIVE) {
      throw Object.assign(new Error('Only HO Executives can change user roles'), { statusCode: 403 });
    }

    const allowed = ['fullName', 'phone', 'language', 'assignedRdcId', 'roleId', 'isActive'];
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const updated = await UserRepository.update(uid, filtered);

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'USER_UPDATED',
      collectionAffected: 'users',
      recordId: uid,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async deactivateUser(uid, actorUser) {
    await UserRepository.update(uid, { isActive: false });
    await auth.updateUser(uid, { disabled: true });

    await auditLogger.log({
      uid: actorUser.uid,
      userRole: actorUser.roleId,
      actionType: 'USER_DEACTIVATED',
      collectionAffected: 'users',
      recordId: uid,
    });
  }
}

module.exports = new UserService();
