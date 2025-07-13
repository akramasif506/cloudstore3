
import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductSort } from '@/components/products/product-sort';
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
    q?: string;
    category?: string;
    subcategory?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
  };
}) {
  const allProducts = await getProducts();

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const minPrice = searchParams?.minPrice ? Number(searchParams.minPrice) : 0;
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : Infinity;
  const sortBy = searchParams?.sortBy || 'newest';

  const filteredProducts = allProducts.filter(product => {
    const categoryMatch = searchParams?.category ? product.category === searchParams.category : true;
    const subcategoryMatch = searchParams?.subcategory ? product.subcategory === searchParams.subcategory : true;
    const priceMatch = product.price >= minPrice && product.price <= maxPrice;
    const searchMatch = searchQuery 
      ? product.name.toLowerCase().includes(searchQuery) || product.description.toLowerCase().includes(searchQuery)
      : true;
    return categoryMatch && subcategoryMatch && priceMatch && searchMatch;
  });

  // Sort products
  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  let adProducts: Product[] = [];
  if (filteredProducts.length === 0 && allProducts.length > 0) {
    // If no products match filter, show a few other products as ads
    // This simple logic takes up to 3 products that were NOT in the filtered list
    adProducts = allProducts
      .filter(p => !filteredProducts.some(fp => fp.id === p.id))
      .slice(0, 3);
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <ProductFilters />
        </div>
      </div>
      <div className="lg:col-span-3 space-y-6">
        <ProductSort />
        <ProductGrid products={filteredProducts} adProducts={adProducts} />
      </div>
    </div>
  );
}
