
'use server';

import type { Product } from '@/lib/types';
import { get, ref, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';


export async function getMyListings(userId: string): Promise<Product[]> {
  if (!db || !userId) {
    return [];
  }
  
  try {
    const productsRef = ref(db, 'products');
    // Query all products where the seller ID matches the current user's ID
    const userProductsQuery = query(productsRef, orderByChild('seller/id'), equalTo(userId));
    const snapshot = await get(userProductsQuery);
    
    let allProducts: Product[] = [];
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      allProducts = Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
        price: Number(productsData[key].price) || 0,
      }));
    }
    
    // Filter to only show pending listings and sort by creation date
    return allProducts
        .filter(p => p.status === 'pending_review')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
