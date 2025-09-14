
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import type { getDatabase } from 'firebase-admin/database';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.string(),
  address: z.string().optional(),
});

function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}


export async function registerUser(values: z.infer<typeof registerSchema>) {
  try {
    // Ensure admin SDK is initialized for this action
    const { db, adminAuth } = initializeAdmin();
    
    // Check if any users exist to determine if this is the first user
    const usersRef = db.ref('users');
    const snapshot = await usersRef.limitToFirst(1).once('value');
    const isFirstUser = !snapshot.exists();
    
    const initials = getInitials(values.name);
    const photoURL = `https://placehold.co/100x100/FFD1E3/333333?text=${initials}`;

    const userRecord = await adminAuth.createUser({
        email: values.email,
        password: values.password,
        displayName: values.name,
        photoURL: photoURL
    });
    
    const userRef = db.ref(`users/${userRecord.uid}`);
    await userRef.set({
      id: userRecord.uid,
      name: values.name,
      email: values.email,
      mobileNumber: values.mobileNumber,
      gender: values.gender,
      address: values.address || '',
      createdAt: new Date().toISOString(),
      // Assign 'admin' role if it's the first user, otherwise 'user'
      role: isFirstUser ? 'admin' : 'user',
      profileImageUrl: userRecord.photoURL || photoURL,
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
