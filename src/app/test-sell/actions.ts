// src/app/test-sell/actions.ts
'use server';

import { cookies } from 'next/headers';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function testSession(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const { adminAuth } = initializeAdmin();
    const sessionCookie = cookies().get('session')?.value;

    if (!sessionCookie) {
      return { success: false, message: 'No session cookie was found on the server. Please log in again.' };
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    return {
      success: true,
      message: 'Session successfully verified on the server!',
      data: { uid: decodedClaims.uid },
    };
  } catch (error: any) {
    console.error("Session verification failed in test action:", error);
    return {
      success: false,
      message: 'Server failed to verify the session cookie.',
      data: { error: error.message || 'An unknown error occurred.' },
    };
  }
}
