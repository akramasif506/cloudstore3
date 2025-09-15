// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import 'dotenv/config';

// This function initializes the Firebase Admin SDK.
// It should only be called in server-side code.
export function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // If credentials are not set, return null instead of throwing an error.
  // This allows the app to run in a degraded mode during local development.
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK credentials are not defined. Server-side Firebase features will be disabled.');
    return null;
  }

  // This gets the existing app if it's initialized, or initializes a new one.
  // This pattern is more robust for serverless environments like Next.js.
  const app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
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
    messaging: app.messaging(),
  };
}
