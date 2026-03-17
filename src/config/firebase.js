
'use strict';

const admin = require('firebase-admin');

class FirebaseConfig {
  constructor() {
    if (FirebaseConfig._instance) return FirebaseConfig._instance;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Newlines in private key are escaped in .env – restore them
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    this.db   = admin.database();   // Realtime Database
    this.auth = admin.auth();       // Firebase Authentication
    this.FieldValue = admin.database.ServerValue;

    FirebaseConfig._instance = this;
  }
}

const instance = new FirebaseConfig();
module.exports = instance;
