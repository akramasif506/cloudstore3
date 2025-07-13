
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.string(),
});

// This action now only handles creating the user in the database.
// The client will handle creating the user in Firebase Auth.
export async function createUserProfileInDb(values: z.infer<typeof registerSchema> & { uid: string }) {
  try {
    const { db } = initializeAdmin();
    
    const userRef = db.ref(`users/${values.uid}`);
    await userRef.set({
      id: values.uid,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      gender: values.gender,
      createdAt: new Date().toISOString(),
      role: 'user', // Default role
      profileImageUrl: `https://placehold.co/100x100.png`,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Firebase DB user creation error:", error);
    return { success: false, error: 'Failed to save user profile.' };
  }
}
