// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import 'dotenv/config';

// This function initializes the Firebase Admin SDK.
// It should only be called in server-side code.
export function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials are not defined in environment variables.');
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
  };
}
