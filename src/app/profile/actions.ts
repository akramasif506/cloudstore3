
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { revalidatePath } from 'next/cache';

const updateProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
});

export async function updateUserProfile(values: z.infer<typeof updateProfileSchema>): Promise<{ success: boolean; message?: string }> {
  if (!db) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  const validatedFields = updateProfileSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid data provided.' };
  }

  const { userId, ...profileData } = validatedFields.data;

  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, profileData);

    // Revalidate the profile page to ensure the data is fresh.
    revalidatePath('/profile');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'Failed to update profile.' };
  }
}
