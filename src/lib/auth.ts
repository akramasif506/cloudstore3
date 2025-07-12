
// src/lib/auth.ts
import admin from 'firebase-admin';
import type { User as ClientUser } from 'firebase/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// This is a type trick to make the server-side user object
// mostly compatible with the client-side one.
type ServerUser = Omit<ClientUser, 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'> & {
    // These methods don't exist on the server, so we type them as undefined.
    delete: undefined;
    getIdToken: undefined;
    getIdTokenResult: undefined;
    reload: undefined;
    toJSON: undefined;
};

function initializeAdmin() {
  if (admin.apps.length) {
    return { adminAuth: admin.auth() };
  }
  const adminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  return { adminAuth: adminApp.auth() };
}

/**
 * Gets the current user from the session cookie.
 * This is a server-side utility.
 * Returns a user object that is shaped like the client-side Firebase User object.
 */
export async function getCurrentUser(): Promise<ServerUser | null> {
  const { adminAuth } = initializeAdmin();
  const session = cookies().get('session')?.value;
  if (!session) {
    return null;
  }
  
  let decodedIdToken: DecodedIdToken;
  try {
    decodedIdToken = await adminAuth?.verifySessionCookie(session, true);
    if (!decodedIdToken) {
      return null;
    }
  } catch (error) {
    console.error("Session cookie verification failed:", error);
    return null;
  }
    
  // Shape the decoded token to look like the client-side User object
  return {
    uid: decodedIdToken.uid,
    email: decodedIdToken.email,
    emailVerified: decodedIdToken.email_verified,
    displayName: decodedIdToken.name || null,
    photoURL: decodedIdToken.picture || null,
    phoneNumber: decodedIdToken.phone_number || null,
    isAnonymous: decodedIdToken.firebase.sign_in_provider === 'anonymous',
    tenantId: decodedIdToken.tenant || null,
    providerData: [], // This is not available in the session cookie.
    metadata: {
        creationTime: decodedIdToken.iat ? new Date(decodedIdToken.iat * 1000).toUTCString() : undefined,
        lastSignInTime: decodedIdToken.auth_time ? new Date(decodedIdToken.auth_time * 1000).toUTCString() : undefined,
    },
    // The methods are not available on the server.
    delete: undefined,
    getIdToken: undefined,
    getIdTokenResult: undefined,
    reload: undefined,
    toJSON: undefined,
  };
}
