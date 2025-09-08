
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface Discount {
  id: string;
  name: string;
  pincodes: string[];
  type: 'percentage' | 'fixed';
  value: number;
  enabled: boolean;
}

export type DiscountMap = { [id: string]: Omit<Discount, 'id'> };

const DISCOUNTS_PATH = 'site_config/location_discounts';

export async function getDiscounts(): Promise<DiscountMap> {
  try {
    const { db } = initializeAdmin();
    const discountsRef = db.ref(DISCOUNTS_PATH);
    const snapshot = await discountsRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching discounts from Firebase:", error);
  }
  return {};
}

export async function saveDiscounts(
  discounts: DiscountMap
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const discountsRef = db.ref(DISCOUNTS_PATH);
    await discountsRef.set(discounts);

    revalidatePath('/dashboard/manage-discounts');
    revalidatePath('/cart'); // Revalidate cart to apply new discounts

    return { success: true, message: 'Discounts saved successfully!' };
  } catch (error) {
    console.error("Error saving discounts to Firebase:", error);
    return { success: false, message: 'Failed to save discounts.' };
  }
}

    