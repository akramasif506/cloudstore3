// src/app/dashboard/pending-products/actions.ts
'use server';

import type { Product } from '@/lib/types';
import { get, ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

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
