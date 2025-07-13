
'use server';

import type { Product } from '@/lib/types';
import { get, ref, update } from 'firebase/database';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateProductSchema } from '@/lib/schemas/product';

export async function getManageableProducts(): Promise<Product[]> {
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
        .filter(p => p.status === 'active' || p.status === 'sold')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching manageable products from Firebase:", error);
    return [];
  }
}

export async function updateProductStatus(
    productId: string, 
    status: 'active' | 'sold'
): Promise<{ success: boolean; message?: string }> {
    try {
        const { db } = initializeAdmin();
        const productRef = ref(db, `products/${productId}`);
        await update(productRef, { status });
        
        revalidatePath('/');
        revalidatePath(`/listings/${productId}`);
        revalidatePath('/dashboard/manage-products');

        return { success: true };
    } catch (error) {
        console.error("Error updating product status:", error);
        return { success: false, message: 'Failed to update product status.' };
    }
}


export async function updateProduct(
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
        await update(productRef, productData);
        
        revalidatePath('/');
        revalidatePath(`/listings/${id}`);
        revalidatePath('/dashboard/manage-products');

        return { success: true };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'Failed to update product.' };
    }
}
