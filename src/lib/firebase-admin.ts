import admin from 'firebase-admin';
import 'dotenv/config';

export function initializeAdmin() {
  if (admin.apps.length > 0) {
    return { 
      adminDb: admin.database(),
      adminStorage: admin.storage()
    };
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return {
    adminDb: admin.database(),
    adminStorage: admin.storage(),
  };
}
