
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';

export type SellerMode = 'admins_only' | 'all_users' | 'specific_users';

export interface SellerSettings {
    mode: SellerMode;
    allowed_sellers: { [userId: string]: boolean };
}

const sellerSettingsSchema = z.object({
  mode: z.enum(['admins_only', 'all_users', 'specific_users']),
  allowed_sellers: z.record(z.boolean()).optional(),
});

const SETTINGS_PATH = 'site_config/seller_settings';

export async function getSellerSettings(): Promise<SellerSettings> {
    const { db } = initializeAdmin();
    try {
        const ref = db.ref(SETTINGS_PATH);
        const snapshot = await ref.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
    } catch (error) {
        console.error('Error fetching seller settings:', error);
    }
    // Default settings
    return {
        mode: 'admins_only',
        allowed_sellers: {},
    };
}

export async function setSellerSettings(
  values: SellerSettings
): Promise<{ success: boolean; message: string }> {
  const validatedFields = sellerSettingsSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { db } = initializeAdmin();

  try {
    const ref = db.ref(SETTINGS_PATH);
    await ref.set(validatedFields.data);

    // Revalidate the header for all users
    revalidatePath('/', 'layout');

    return { success: true, message: 'Seller settings have been updated.' };
  } catch (error) {
    console.error('Error setting seller settings:', error);
    return { success: false, message: 'Failed to update settings.' };
  }
}

export async function searchUsers(query: string): Promise<User[]> {
    if (!query) return [];

    try {
        const { db } = initializeAdmin();
        const usersRef = db.ref('users');
        const snapshot = await usersRef.once('value');
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const lowercasedQuery = query.toLowerCase();
            return Object.keys(usersData)
                .map(key => ({ id: key, ...usersData[key] }))
                .filter(user => 
                    user.name.toLowerCase().includes(lowercasedQuery) ||
                    user.email.toLowerCase().includes(lowercasedQuery)
                );
        }
        return [];
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
}
