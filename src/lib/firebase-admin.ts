import admin from 'firebase-admin';

interface AdminApp {
  db: admin.database.Database;
  storage: admin.storage.Storage;
}

export function initializeAdmin(): AdminApp {
  if (admin.apps.length > 0) {
    const app = admin.app();
    return {
      db: app.database(),
      storage: app.storage(),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials are not defined in environment variables.');
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
    db: app.database(),
    storage: app.storage(),
  };
}
