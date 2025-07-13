
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
    const snapshot = await get(productsRef);
    
    let allProducts: Product[] = [];
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      allProducts = Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
        price: Number(productsData[key].price) || 0,
      }));
    }
    
    // Filter products on the server
    const userProducts = allProducts.filter(product => product.seller && product.seller.id === userId);
    
    // Sort by creation date, newest first
    return userProducts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
