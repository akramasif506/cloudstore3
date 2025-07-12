
'use server';

import type { Product } from '@/lib/types';
import { get, ref, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';


export async function getMyListings(userId: string): Promise<Product[]> {
  if (!db || !userId) {
    return [];
  }
  
  try {
    // We will query the main 'products' node to find all products by this user.
    // This is more efficient and scalable than trying to traverse unknown user-specific paths.
    const productsRef = ref(db, 'products');
    const userProductsQuery = query(productsRef, orderByChild('seller/id'), equalTo(userId));
    
    const snapshot = await get(userProductsQuery);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allProducts: Product[] = Object.keys(data).map(productId => {
        const product = data[productId];
        return {
            ...product,
            id: productId,
            price: Number(product.price) || 0,
        }
      });
      
      // Sort by creation date, newest first
      return allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
