

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
  let adminAuth, db;
  try {
    ({ adminAuth, db } = initializeAdmin());
    decodedIdToken = await adminAuth.verifySessionCookie(session, true);
    if (!decodedIdToken) {
      return null;
    }
  } catch (error) {
    console.error("Session cookie verification failed:", error);
    return null;
  }
  
  try {
    // Fetch the user's profile from the Realtime Database
    const userProfileRef = ref(db, `users/${decodedIdToken.uid}`);
    const snapshot = await get(userProfileRef);

    if (snapshot.exists()) {
      return snapshot.val() as AppUser;
    }
    return null; // User exists in Auth, but not in DB
  } catch (dbError) {
    console.error("Failed to fetch user profile from database:", dbError);
    return null;
  }
}
