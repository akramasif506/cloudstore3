
'use server';

import type { Product, User } from '@/lib/types';
import { get, ref, child } from 'firebase/database';
import { db } from '@/lib/firebase';


async function getCurrentUser(userId: string): Promise<User | null> {
    if (!db) return null;
    try {
      const userSnapshot = await get(child(ref(db), `users/${userId}`));
      if (userSnapshot.exists()) {
        return userSnapshot.val() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
}


export async function getMyListings(userId: string): Promise<Product[]> {
  if (!db || !userId) {
    return [];
  }
  
  try {
    const user = await getCurrentUser(userId);
    if (!user || !user.mobileNumber) {
        console.log("User or user mobile not found, cannot fetch listings.");
        return [];
    }

    const userListingsRef = ref(db, user.mobileNumber);
    const snapshot = await get(userListingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allProducts: Product[] = [];
      
      // The data is structured as {date: {category: {productId: product}}}
      // We need to iterate through all of it.
      Object.keys(data).forEach(date => { // Iterate over dates
        const categories = data[date];
        Object.keys(categories).forEach(category => { // Iterate over categories
          const products = categories[category];
          Object.keys(products).forEach(productId => { // Iterate over products
            const product = products[productId];
            // The seller ID check is an extra safeguard
            if (product.seller && product.seller.id === userId) {
              allProducts.push({
                ...product,
                id: productId,
                price: Number(product.price) || 0,
              });
            }
          });
        });
      });
      
      return allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
