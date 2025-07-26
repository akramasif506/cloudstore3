
// src/lib/auth.ts
import { initializeAdmin } from '@/lib/firebase-admin';
import type { User as AppUser } from '@/lib/types';
import { cookies } from 'next/headers';
import { ref, get } from 'firebase/database';


/**
 * Gets the current user from the session cookie, enriched with profile data.
 * This is a server-side utility.
 * Returns a user object that is shaped like the client-side User object.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = cookies().get('session')?.value;
  if (!session) {
    return null;
  }
  
  let decodedIdToken;
  try {
    const { adminAuth, db } = initializeAdmin();
    decodedIdToken = await adminAuth.verifySessionCookie(session, true);
  
    // Fetch the user's profile from the Realtime Database
    const userProfileRef = ref(db, `users/${decodedIdToken.uid}`);
    const snapshot = await get(userProfileRef);

    if (snapshot.exists()) {
      const userProfileData = snapshot.val();
      // Combine the ID from the token with the profile data from the DB
      return { 
        id: decodedIdToken.uid,
        ...userProfileData
      };
    }
    // This case means user exists in Auth, but not in our Realtime DB.
    return null; 
  } catch (error) {
    // Session cookie is invalid or another error occurred.
    // This is not a critical error for page rendering, so we log it and return null.
    console.error("Session verification failed:", error);
    return null;
  }
}
