
import { ProductGrid } from '@/components/products/product-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { get, ref } from 'firebase/database';
import { useAuth } from '@/context/auth-context';
import { MyListingsClient } from './my-listings-client';


async function getUnderReviewProducts(userId: string): Promise<Product[]> {
  if (!db) {
    console.warn("Firebase is not configured. Returning empty products.");
    return [];
  }
  if (!userId) {
    return [];
  }
  try {
    const underReviewRef = ref(db, 'CloudStore/products/under_review');
    const snapshot = await get(underReviewRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const allProducts: Product[] = [];
      // Data is structured as {date: {category: {productId: product}}}
      Object.values(data).forEach((dateEntries: any) => {
        Object.values(dateEntries).forEach((categoryEntries: any) => {
          Object.values(categoryEntries).forEach((product: any) => {
            // Ensure product has a seller and the ID matches
            if (product.seller && product.seller.id === userId) {
              allProducts.push({
                ...product,
                price: Number(product.price) || 0,
              });
            }
          });
        });
      });
      return allProducts;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}


export default async function MyListingsPage() {
  
  return (
    <div>
        <MyListingsClient />
    </div>
  );
}

