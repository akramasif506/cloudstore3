
// src/app/dashboard/manage-featured-product/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Product } from '@/lib/types';

export interface FeaturedProductInfo {
    productId: string;
    promoText: string;
}

const featuredProductSchema = z.object({
  productId: z.string().min(1, 'Please select a product.'),
  promoText: z.string().min(3, 'Promo text must be at least 3 characters.').max(20, 'Promo text must be 20 characters or less.'),
});

const FEATURED_PRODUCT_PATH = 'site_config/featured_product';

export async function setFeaturedProduct(
  values: z.infer<typeof featuredProductSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = featuredProductSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { db } = initializeAdmin();

  try {
    const featuredProductRef = db.ref(FEATURED_PRODUCT_PATH);
    await featuredProductRef.set(validatedFields.data);

    revalidatePath('/');
    revalidatePath('/dashboard/manage-featured-product');


    return { success: true, message: 'Featured product has been updated.' };
  } catch (error) {
    console.error('Error setting featured product:', error);
    return { success: false, message: 'Failed to set featured product.' };
  }
}

export async function clearFeaturedProduct(): Promise<{ success: boolean; message: string }> {
  const { db } = initializeAdmin();
  try {
    const featuredProductRef = db.ref(FEATURED_PRODUCT_PATH);
    await featuredProductRef.remove();
    
    revalidatePath('/');
    revalidatePath('/dashboard/manage-featured-product');
    
    return { success: true, message: 'Featured product has been cleared.' };
  } catch (error) {
    console.error('Error clearing featured product:', error);
    return { success: false, message: 'Failed to clear featured product.' };
  }
}

export async function getFeaturedProduct(): Promise<(FeaturedProductInfo & { product: Product | null }) | null> {
    const { db } = initializeAdmin();
    try {
        const featuredProductRef = db.ref(FEATURED_PRODUCT_PATH);
        const snapshot = await featuredProductRef.once('value');
        if (snapshot.exists()) {
            const info: FeaturedProductInfo = snapshot.val();
            
            const productRef = db.ref(`products/${info.productId}`);
            const productSnapshot = await productRef.once('value');
            const product = productSnapshot.exists() ? { ...productSnapshot.val(), id: info.productId } : null;

            return { ...info, product };
        }
        return null;
    } catch (error) {
        console.error('Error fetching featured product:', error);
        return null;
    }
}
