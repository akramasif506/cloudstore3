
'use server';

import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.string(),
});

export async function registerUser(values: z.infer<typeof registerSchema>) {
  if (!auth || !db) {
    return { success: false, error: 'Firebase is not configured.' };
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
    const user = userCredential.user;
    
    // Using a consistent placeholder. The text query param can cause issues with image hosts.
    const profileImageUrl = `https://placehold.co/100x100.png`;

    // Update Firebase Auth profile displayName
    await updateProfile(user, {
      displayName: values.name,
      // We will rely on our database record for the photoURL to ensure consistency
    });
    
    // Create user profile in Realtime Database, this is our source of truth
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      id: user.uid,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      gender: values.gender,
      createdAt: new Date().toISOString(),
      role: 'user', // Default role
      profileImageUrl: profileImageUrl
    });

    return { success: true, userId: user.uid };
  } catch (error: any) {
    let errorMessage = 'An unknown error occurred.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already in use.';
    } else {
        console.error("Firebase registration error:", error);
    }
    return { success: false, error: errorMessage };
  }
}
