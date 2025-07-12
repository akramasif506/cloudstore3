'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
});

export async function sendMessage(values: z.infer<typeof contactSchema>) {
  try {
    const messagesRef = ref(db, 'messages');
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      ...values,
      timestamp: new Date().toISOString(),
    });
    console.log('Message saved to Firebase Realtime Database');
    return { success: true };
  } catch (error) {
    console.error('Error saving message to Firebase:', error);
    return { success: false, error: 'Failed to send message.' };
  }
}
