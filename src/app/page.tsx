
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
      const allProducts: Product[] = Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
        price: Number(productsData[key].price) || 0,
        imageUrl: productsData[key].imageUrl || 'https://placehold.co/400x300.png',
      }));
      // Filter for active products on the server
      return allProducts.filter(product => product.status === 'active');
    }
    return [];
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    return [];
  }
}

export default async function Home({
  searchParams
}: {
  searchParams?: {
    category?: string;
    subcategory?: string;
    // Add other filter params here like distance, price etc.
  };
}) {
  const allProducts = await getProducts();

  const filteredProducts = allProducts.filter(product => {
    const categoryMatch = searchParams?.category ? product.category === searchParams.category : true;
    const subcategoryMatch = searchParams?.subcategory ? product.subcategory === searchParams.subcategory : true;
    return categoryMatch && subcategoryMatch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <ProductFilters />
        </div>
      </div>
      <div className="lg:col-span-3">
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}
