
import { FeaturedProductBanner } from '@/components/products/featured-product-banner';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductSearch } from '@/components/products/product-search';
import { ProductSort } from '@/components/products/product-sort';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { get, ref } from 'firebase/database';
import { getFeaturedProduct } from './dashboard/manage-featured-product/actions';

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
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
  };
}) {
  const allProducts = await getProducts();
  const featuredProductInfo = await getFeaturedProduct();

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const category = searchParams?.category;
  const subcategory = searchParams?.subcategory;
  const condition = searchParams?.condition;
  const minPrice = searchParams?.minPrice ? Number(searchParams.minPrice) : 0;
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : Infinity;
  const sortBy = searchParams?.sortBy || 'newest';

  const filteredProducts = allProducts.filter(product => {
    // Exclude the featured product from the main grid if it exists
    if (featuredProductInfo?.productId === product.id) {
        return false;
    }
    const categoryMatch = category ? product.category === category : true;
    const subcategoryMatch = subcategory ? product.subcategory === subcategory : true;
    const conditionMatch = condition ? product.condition === condition : true;
    const priceMatch = product.price >= minPrice && product.price <= maxPrice;
    const searchMatch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery)
      : true;
    return categoryMatch && subcategoryMatch && priceMatch && searchMatch && conditionMatch;
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
    adProducts = allProducts
      .filter(p => !filteredProducts.some(fp => fp.id === p.id))
      .slice(0, 3);
  }


  return (
    <div className="space-y-8">
      {featuredProductInfo?.product && (
        <FeaturedProductBanner 
            product={featuredProductInfo.product} 
            promoText={featuredProductInfo.promoText}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProductFilters />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full sm:flex-grow">
                  <ProductSearch />
              </div>
              <div className="w-full sm:w-auto">
                  <ProductSort />
              </div>
          </div>
          <ProductGrid products={filteredProducts} adProducts={adProducts} />
        </div>
      </div>
    </div>
  );
}
