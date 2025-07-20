
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from 'firebase/auth';
import { getMessaging, type Messaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let db: Database | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let messaging: Messaging | null = null;


if (firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.storageBucket) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
      messaging = getMessaging(app);
    }
} else {
    console.warn("Firebase config is incomplete. Firebase services will be disabled.");
}

export { app, db, storage, auth, messaging };
