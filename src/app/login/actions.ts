'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { signInWithEmailAndPassword, getAuth as getClientAuth } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginWithCredentials(
  values: z.infer<typeof loginSchema>
): Promise<{ success: boolean; message: string }> {

  const validatedFields = loginSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid email or password format.' };
  }
  
  const { email, password } = validatedFields.data;

  try {
    // We need to use the client SDK to sign in, which gives us an ID token.
    if (!clientAuth) {
        throw new Error("Client auth is not initialized");
    }
    const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Now use the Admin SDK to create a session cookie from the ID token.
    const { adminAuth } = initializeAdmin();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie on the browser.
    cookies().set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      maxAge: expiresIn,
      path: '/',
    });

    return { success: true, message: 'Login successful!' };
  } catch (error: any) {
    console.error('Login Action Error:', error);
    let message = 'An unknown error occurred during login.';
    // Provide more specific error messages based on Firebase error codes
    switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            message = 'Invalid email or password.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many login attempts. Please try again later.';
            break;
    }
    return { success: false, message };
  }
}
