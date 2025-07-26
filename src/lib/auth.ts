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
  } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : 'An unknown initialization error occurred.';
      console.error("Firebase Admin SDK initialization failed in getCurrentUser:", errorMessage);
      return null;
  }
  
  try {
    decodedIdToken = await adminAuth.verifySessionCookie(session, true);
  } catch (error: any) {
    // Session cookie is invalid, expired, or something else went wrong.
    // This is an expected condition for invalid sessions, not a server error.
    if (error.code === 'auth/session-cookie-expired') {
        // Silently handle expired cookies as a logged-out state.
        return null;
    }
    // For other verification errors, log them but still treat as logged-out.
    console.error("Session verification failed:", error.message || error);
    return null;
  }
  
  try {
    // Fetch the user's profile from the Realtime Database
    const userProfileRef = ref(db, `users/${decodedIdToken.uid}`);
    const snapshot = await get(userProfileRef);

    if (snapshot.exists()) {
      const userProfileData = snapshot.val();
      // Combine the ID from the token with the profile data from the DB
      // This is the correct way to merge auth and db user info.
      return { 
        id: decodedIdToken.uid,
        ...userProfileData
      };
    }
    // This case means user exists in Auth, but not in our Realtime DB.
    // They should not be considered a valid user of the app.
    return null; 
  } catch (dbError) {
    console.error("Failed to fetch user profile from database:", dbError);
    return null;
  }
}
