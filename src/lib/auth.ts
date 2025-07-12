// src/lib/auth.ts
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

/**
 * Gets the current user from the session cookie.
 * This is a server-side utility.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = cookies().get('session')?.value;
  if (!session) {
    return null;
  }
  
  try {
    const decodedIdToken = await adminAuth?.verifySessionCookie(session, true);
    if (!decodedIdToken) {
      return null;
    }
    
    // The decoded token has the user information from Firebase Auth
    // We need to shape it to match the Firebase User type for consistency
    const user: User = {
        uid: decodedIdToken.uid,
        email: decodedIdToken.email,
        emailVerified: decodedIdToken.email_verified,
        displayName: decodedIdToken.name,
        photoURL: decodedIdToken.picture,
        // The following are not available in the session cookie by default
        // but we fill what we can.
        phoneNumber: null,
        isAnonymous: decodedIdToken.firebase.sign_in_provider === 'anonymous',
        tenantId: decodedIdToken.tenant,
        providerData: [], // This would require a separate lookup
        metadata: {
            creationTime: decodedIdToken.iat ? new Date(decodedIdToken.iat * 1000).toUTCString() : undefined,
            lastSignInTime: decodedIdToken.auth_time ? new Date(decodedIdToken.auth_time * 1000).toUTCString() : undefined,
        },
        // These are methods on the client User object and cannot be replicated here
        delete: () => Promise.resolve(),
        getIdToken: () => Promise.resolve(''),
        getIdTokenResult: () => Promise.resolve({} as any),
        reload: () => Promise.resolve(),
        toJSON: () => ({}),
    };
    
    return user;

  } catch (error) {
    console.error("Session cookie verification failed:", error);
    return null;
  }
}
