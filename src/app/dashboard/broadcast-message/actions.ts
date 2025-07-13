'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const broadcastSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const BROADCAST_PATH = 'broadcast';

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

export async function getBroadcastMessage(): Promise<{ message: string; link: string | null } | null> {
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
