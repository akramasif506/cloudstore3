
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.string(),
});

export async function registerUser(values: z.infer<typeof registerSchema>) {
  try {
    const { adminAuth, db } = initializeAdmin();
    
    const userRecord = await getAuth().createUser({
        email: values.email,
        password: values.password,
        displayName: values.name,
        photoURL: `https://placehold.co/100x100.png`
    });
    
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({
      id: userRecord.uid,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      gender: values.gender,
      createdAt: new Date().toISOString(),
      role: 'user', // Default role
      profileImageUrl: userRecord.photoURL,
    });

    return { success: true, userId: userRecord.uid };
  } catch (error: any) {
    let errorMessage = 'An unknown error occurred.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'This email address is already in use.';
    } else {
        console.error("Firebase registration error:", error);
    }
    return { success: false, error: errorMessage };
  }
}
