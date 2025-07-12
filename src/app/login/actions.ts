
'use server';

import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginUser(values: z.infer<typeof loginSchema>) {
  if (!auth) {
    return { success: false, error: 'Firebase is not configured.' };
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
    return { success: true, userId: userCredential.user.uid };
  } catch (error: any) {
    let errorMessage = 'An unknown error occurred.';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Invalid email or password.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many login attempts. Please try again later.';
        break;
      default:
        console.error('Firebase login error:', error);
        break;
    }
    return { success: false, error: errorMessage };
  }
}
