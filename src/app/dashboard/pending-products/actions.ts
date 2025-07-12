// src/app/dashboard/pending-products/actions.ts
'use server';

import type { Product } from '@/lib/types';
import { get, ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function getPendingProducts(): Promise<Product[]> {
  if (!db) {
    return [];
  }
  
  try {
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
    if (!db) {
        return { success: false, message: 'Firebase not configured.' };
    }

    try {
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

export const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.string().nonempty('Please select a category.'),
  subcategory: z.string().nonempty('Please select a subcategory.'),
});

export async function updateAndApproveProduct(
    values: z.infer<typeof updateProductSchema>
): Promise<{ success: boolean; message?: string }> {
    if (!db) {
        return { success: false, message: 'Firebase not configured.' };
    }

    const validatedFields = updateProductSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid form data.',
        };
    }

    const { id, ...productData } = validatedFields.data;

    try {
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
