
'use server';

import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface ProductCondition {
  enabled: boolean;
}

export type ProductConditionMap = {
    "New": ProductCondition;
    "Like New": ProductCondition;
    "Used": ProductCondition;
};

const CONDITIONS_PATH = 'site_config/product_conditions';

export async function getProductConditions(): Promise<ProductConditionMap> {
  try {
    const { db } = initializeAdmin();
    const conditionsRef = db.ref(CONDITIONS_PATH);
    const snapshot = await conditionsRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching product conditions from Firebase:", error);
  }
  
  // Default to only "New" enabled
  return {
    "New": { enabled: true },
    "Like New": { enabled: false },
    "Used": { enabled: false }
  };
}

export async function saveProductConditions(
  conditions: ProductConditionMap
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const conditionsRef = db.ref(CONDITIONS_PATH);
    await conditionsRef.set(conditions);

    // Revalidate paths that use these conditions
    revalidatePath('/listings/new');
    revalidatePath('/'); // For filters
    revalidatePath('/dashboard/manage-product-conditions');

    return { success: true, message: 'Product conditions have been saved successfully!' };
  } catch (error) {
    console.error("Error saving product conditions to Firebase:", error);
    return { success: false, message: 'Failed to save product conditions.' };
  }
}
