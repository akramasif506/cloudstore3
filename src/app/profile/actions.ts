
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const updateProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email(),
  gender: z.enum(['male', 'female', 'other']),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  address: z.string().optional(),
});

export async function updateUserProfile(values: z.infer<typeof updateProfileSchema>): Promise<{ success: boolean; message?: string }> {
  
  const validatedFields = updateProfileSchema.safeParse(values);
  if (!validatedFields.success) {
    console.error("Profile update validation error:", validatedFields.error.flatten());
    return { success: false, message: 'Invalid data provided.' };
  }
  
  let db;
  try {
    ({ db } = initializeAdmin());
  } catch(error) {
     console.error("Firebase Admin Init Error in profile action:", error);
     return { success: false, message: 'Server configuration error.' };
  }


  const { userId, email, gender, ...profileData } = validatedFields.data;

  try {
    const userRef = db.ref(`users/${userId}`);
    // We only update the fields that can be changed
    await userRef.update({
        name: profileData.name,
        mobileNumber: profileData.mobileNumber,
        address: profileData.address,
    });

    // Revalidate the profile page to ensure the data is fresh.
    revalidatePath('/profile');
    
    return { success: true, message: 'Profile updated successfully.' };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'Failed to update profile.' };
  }
}
