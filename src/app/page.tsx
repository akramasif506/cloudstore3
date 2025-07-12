import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { get, ref } from 'firebase/database';

async function getProducts(): Promise<Product[]> {
  if (!db) {
    console.warn("Firebase is not configured. Returning empty products.");
    return [];
  }
  try {
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      return Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
        // Ensure price is a number, as it might be a string from the form/db
        price: Number(productsData[key].price) || 0,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <ProductFilters />
        </div>
      </div>
      <div className="lg:col-span-3">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
