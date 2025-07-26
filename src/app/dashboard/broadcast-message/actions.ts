
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { CategoryMap } from '../manage-categories/actions';

const broadcastSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const BROADCAST_PATH = 'broadcast';
const CATEGORIES_PATH = 'site_config/categories';

export async function setBroadcastMessage(
  values: z.infer<typeof broadcastSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = broadcastSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { message, link } = validatedFields.data;
  const { db } = initializeAdmin();

  try {
    const broadcastRef = db.ref(BROADCAST_PATH);
    await broadcastRef.set({
      id: new Date().getTime(), // Add a unique ID for the message
      message,
      link: link || null,
      updatedAt: new Date().toISOString(),
    });

    // Revalidate the root layout to ensure all pages see the new banner
    revalidatePath('/', 'layout');

    return { success: true, message: 'Broadcast message has been set.' };
  } catch (error) {
    console.error('Error setting broadcast message:', error);
    return { success: false, message: 'Failed to set broadcast message.' };
  }
}

export async function clearBroadcastMessage(): Promise<{ success: boolean; message: string }> {
  const { db } = initializeAdmin();
  try {
    const broadcastRef = db.ref(BROADCAST_PATH);
    await broadcastRef.remove();
    
    revalidatePath('/', 'layout');
    
    return { success: true, message: 'Broadcast message has been cleared.' };
  } catch (error) {
    console.error('Error clearing broadcast message:', error);
    return { success: false, message: 'Failed to clear broadcast message.' };
  }
}

export async function getBroadcastMessage(): Promise<{ id: number; message: string; link: string | null } | null> {
    const { db } = initializeAdmin();
    try {
        const broadcastRef = db.ref(BROADCAST_PATH);
        const snapshot = await broadcastRef.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error('Error fetching broadcast message:', error);
        return null;
    }
}

// Re-using the getCategories logic by moving it to a shared location is a good practice,
// but for this scope, we can just fetch them here as well.
export async function getCategoriesForBroadcast(): Promise<CategoryMap> {
  try {
    const { db } = initializeAdmin();
    const categoriesRef = db.ref(CATEGORIES_PATH);
    const snapshot = await categoriesRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching categories from Firebase:", error);
  }
  return {};
}
