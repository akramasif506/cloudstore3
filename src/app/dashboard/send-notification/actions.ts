// src/app/dashboard/send-notification/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { MulticastMessage } from 'firebase-admin/messaging';
import type { User } from '@/lib/types';

const sendNotificationSchema = z.object({
  target: z.enum(['all', 'specific']),
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required.'),
  body: z.string().min(1, 'Body is required.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

export async function getAllUsers(): Promise<Pick<User, 'id' | 'name'>[]> {
    try {
        const { db } = initializeAdmin();
        const usersRef = db.ref('users');
        const snapshot = await usersRef.once('value');
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            return Object.keys(usersData).map(id => ({
                id,
                name: usersData[id].name || `User ${id.substring(0, 6)}`,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
}

export async function sendNotification(
  values: z.infer<typeof sendNotificationSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = sendNotificationSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { target, userId, title, body, link } = validatedFields.data;
  const { db, adminAuth, messaging } = initializeAdmin();

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
        for (const uid in allTokensData) {
            const userTokens = allTokensData[uid];
            if (typeof userTokens === 'object' && userTokens !== null) {
                fcmTokens.push(...Object.values<string>(userTokens));
            }
        }
      }
    }

    if (fcmTokens.length === 0) {
      return { success: false, message: 'No registered devices found for the selected target.' };
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
      message: `Notification sent. Successes: ${successes}, Failures: ${failures}.`,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to send notification: ${errorMessage}` };
  }
}
