
'use server';

import admin from 'firebase-admin';
import 'dotenv/config';

export function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials are not defined in environment variables.');
  }

  if (admin.apps.length > 0) {
    return {
      adminAuth: admin.auth(),
      db: admin.database(),
      storage: admin.storage(),
    };
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return {
    adminAuth: app.auth(),
    db: app.database(),
    storage: app.storage(),
  };
}
