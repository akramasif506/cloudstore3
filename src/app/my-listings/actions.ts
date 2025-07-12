
'use server';

import type { Product } from '@/lib/types';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function getUnderReviewProducts(userId: string): Promise<Product[]> {
  if (!db || !userId) {
    return [];
  }
  try {
    const underReviewRef = ref(db, 'CloudStore/products/under_review');
    const snapshot = await get(underReviewRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allProducts: Product[] = [];
      
      // Iterate over dates
      Object.keys(data).forEach(date => {
        const categories = data[date];
        // Iterate over categories
        Object.keys(categories).forEach(category => {
          const products = categories[category];
          // Iterate over products
          Object.keys(products).forEach(productId => {
            const product = products[productId];
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
      
      return allProducts.reverse(); // Show newest first
    }
    return [];
  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}
