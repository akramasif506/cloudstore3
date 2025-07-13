// src/app/dashboard/pending-products/actions.ts
'use server';

import type { Product } from '@/lib/types';
import { get, ref, update } from 'firebase/database';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateProductSchema } from '@/lib/schemas/product';

export async function getPendingProducts(): Promise<Product[]> {
  try {
    const { db } = initializeAdmin();
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);
    
    let allProducts: Product[] = [];
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      allProducts = Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
      }));
    }
    
    return allProducts
        .filter(p => p.status === 'pending_review')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching pending products from Firebase:", error);
    return [];
  }
}

export async function approveProduct(productId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const { db } = initializeAdmin();
        const productRef = ref(db, `products/${productId}`);
        await update(productRef, {
            status: 'active'
        });
        
        // Revalidate paths to reflect the change immediately
        revalidatePath('/');
        revalidatePath(`/listings/${productId}`);
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/pending-products');

        return { success: true };
    } catch (error) {
        console.error("Error approving product:", error);
        return { success: false, message: 'Failed to approve product.' };
    }
}

export async function updateAndApproveProduct(
    values: z.infer<typeof updateProductSchema>
): Promise<{ success: boolean; message?: string }> {
    const validatedFields = updateProductSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid form data.',
        };
    }

    const { id, ...productData } = validatedFields.data;

    try {
        const { db } = initializeAdmin();
        const productRef = ref(db, `products/${id}`);
        await update(productRef, {
            ...productData,
            status: 'active'
        });
        
        revalidatePath('/');
        revalidatePath(`/listings/${id}`);
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/pending-products');

        return { success: true };
    } catch (error) {
        console.error("Error updating and approving product:", error);
        return { success: false, message: 'Failed to update and approve product.' };
    }
}
