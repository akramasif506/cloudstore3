// src/app/dashboard/send-notification/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { MulticastMessage } from 'firebase-admin/messaging';

const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  body: z.string().min(1, 'Body is required.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

export async function sendNotification(
  values: z.infer<typeof sendNotificationSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = sendNotificationSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { title, body, link } = validatedFields.data;
  const { db, messaging } = initializeAdmin();

  try {
    const tokensSnapshot = await db.ref('fcm_tokens').once('value');
    if (!tokensSnapshot.exists()) {
      return { success: false, message: 'No registered devices found.' };
    }
    
    // The data is an object where keys are push IDs and values are the tokens
    const tokensData = tokensSnapshot.val();
    const fcmTokens = Object.values<string>(tokensData);

    if (fcmTokens.length === 0) {
      return { success: false, message: 'No registered devices found.' };
    }
    
    // Remove duplicate tokens to avoid sending multiple times to the same device
    const uniqueTokens = [...new Set(fcmTokens)];

    const message: MulticastMessage = {
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: link || '/',
        },
      },
      tokens: uniqueTokens,
    };
    
    const response = await messaging.sendEachForMulticast(message);

    const successes = response.responses.filter(r => r.success).length;
    const failures = response.failureCount;

    return {
      success: true,
      message: `Notification sent to ${uniqueTokens.length} device(s). Successes: ${successes}, Failures: ${failures}.`,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send notification: ${errorMessage}` };
  }
}
