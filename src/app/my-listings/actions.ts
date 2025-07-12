
'use server';

import type { Product } from '@/lib/types';
import { get, ref, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';


export async function getMyListings(userId: string): Promise<Product[]> {
  if (!db || !userId) {
    return [];
  }
  
  try {
    // We query the `under_review` path since that's where new listings are stored.
    const productsRef = ref(db, 'CloudStore/products/under_review');
    const snapshot = await get(productsRef);
    
    let allProducts: Product[] = [];
    if (snapshot.exists()) {
      const dates = snapshot.val();
      // Iterate through dates, categories, and products
      for (const date in dates) {
        for (const category in dates[date]) {
          for (const productId in dates[date][category]) {
            const product = dates[date][category][productId];
            // Filter products by the current user's ID
            if (product.seller && product.seller.id === userId) {
              allProducts.push({
                ...product,
                id: productId,
                price: Number(product.price) || 0,
              });
            }
          }
        }
      }
    }
    
    // Sort by creation date, newest first
    return allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
