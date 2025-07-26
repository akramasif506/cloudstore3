
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface VariantOption {
  value: string;
}

export interface VariantSet {
  id: string;
  name: string;
  options: VariantOption[];
}

export type VariantSetMap = { [id: string]: Omit<VariantSet, 'id'> };

const VARIANTS_PATH = 'site_config/variants';

export async function getVariantSets(): Promise<VariantSetMap> {
  try {
    const { db } = initializeAdmin();
    const variantsRef = db.ref(VARIANTS_PATH);
    const snapshot = await variantsRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching variant sets from Firebase:", error);
  }
  return {};
}

export async function saveVariantSets(
  variants: VariantSetMap
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const variantsRef = db.ref(VARIANTS_PATH);
    await variantsRef.set(variants);

    revalidatePath('/dashboard/manage-variants');
    // Also revalidate product pages eventually
    // revalidatePath('/listings/new');

    return { success: true, message: 'Variant sets saved successfully!' };
  } catch (error) {
    console.error("Error saving variant sets to Firebase:", error);
    return { success: false, message: 'Failed to save variant sets.' };
  }
}
