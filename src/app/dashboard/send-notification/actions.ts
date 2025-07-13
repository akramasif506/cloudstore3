// src/app/dashboard/send-notification/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { Message } from 'firebase-admin/messaging';

const sendNotificationSchema = z.object({
  target: z.enum(['all', 'specific']),
  userId: z.string().optional(),
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

  const { target, userId, title, body, link } = validatedFields.data;
  const { db, adminAuth } = initializeAdmin();

  try {
    const fcmTokens: string[] = [];

    if (target === 'specific') {
      if (!userId) {
        return { success: false, message: 'User ID is required for specific targeting.' };
      }
      const tokensSnapshot = await db.ref(`fcm_tokens/${userId}`).once('value');
      if (tokensSnapshot.exists()) {
        const tokensData = tokensSnapshot.val();
        fcmTokens.push(...Object.values<string>(tokensData));
      }
    } else {
      // Target is 'all'
      const allTokensSnapshot = await db.ref('fcm_tokens').once('value');
      if (allTokensSnapshot.exists()) {
        const allTokensData = allTokensSnapshot.val();
        for (const userId in allTokensData) {
          fcmTokens.push(...Object.values<string>(allTokensData[userId]));
        }
      }
    }

    if (fcmTokens.length === 0) {
      return { success: false, message: 'No registered devices found for the selected target.' };
    }

    const message: Message = {
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: link || '/',
        },
      },
      // This will be sent to all tokens
      token: '', // This will be overridden in sendToDevice
    };
    
    // Firebase Admin SDK's sendToDevice can handle an array of tokens
    const response = await adminAuth.sendToDevice(fcmTokens, message.notification!);

    const successes = response.results.filter(r => r.messageId).length;
    const failures = response.failureCount;

    return {
      success: true,
      message: `Notification sent. Successes: ${successes}, Failures: ${failures}.`,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send notification: ${errorMessage}` };
  }
}
