// src/modules/users/UserRepository.js
'use strict';

const BaseRepository = require('../../utils/BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const results = await this.findWhere('email', email);
    return results[0] || null;
  }

  async findByRdc(rdcId) {
    return this.findWhere('assignedRdcId', rdcId);
  }

  async findByRole(roleId) {
    return this.findWhere('roleId', roleId);
  }
}

module.exports = new UserRepository();
