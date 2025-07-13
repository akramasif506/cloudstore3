
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { ref, push, set } from 'firebase/database';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('A valid email is required.'),
  message: z.string().min(1, 'Message cannot be empty.'),
});

export async function sendMessage(
  values: z.infer<typeof contactSchema>
): Promise<{ success: boolean; error?: string }> {
  const validatedFields = contactSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid form data.' };
  }

  let db;
  try {
    // Server actions must use the admin SDK for database writes
    ({ db } = initializeAdmin());
  } catch (error) {
    console.error('Firebase Admin Init Error in contact action:', error);
    return { success: false, error: 'Server configuration error.' };
  }
  
  try {
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      ...validatedFields.data,
      timestamp: new Date().toISOString(),
    });
    console.log('Message saved to Firebase Realtime Database');
    return { success: true };
  } catch (error) {
    console.error('Error saving message to Firebase:', error);
    return { success: false, error: 'Failed to send message.' };
  }
}
