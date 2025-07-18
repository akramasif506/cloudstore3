
import { FeaturedProductBanner } from '@/components/products/featured-product-banner';
import { ProductSearch } from '@/components/products/product-search';
import { ProductSort } from '@/components/products/product-sort';
import { db } from '@/lib/firebase';
import type { Product, Category } from '@/lib/types';
import { get, ref } from 'firebase/database';
import { getFeaturedProduct } from './dashboard/manage-featured-product/actions';
import { getCategories } from './dashboard/manage-categories/actions';
import type { CategoryMap } from './dashboard/manage-categories/actions';
import { CategoryBrowser } from '@/components/products/category-browser';
import { ProductShowcase } from '@/components/products/product-showcase';

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
    sortBy?: string;
  };
}) {
  const allProducts = await getProducts();
  const featuredProductInfo = await getFeaturedProduct();
  const categoryMap: CategoryMap = await getCategories();
  
  const categories: Category[] = Object.keys(categoryMap).map(name => ({
    name,
    // For now, we'll just show a placeholder image. This could be extended later.
    imageUrl: `https://placehold.co/400x300.png?text=${encodeURIComponent(name)}`,
    productCount: allProducts.filter(p => p.category === name).length,
  }));

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const selectedCategory = searchParams?.category;
  const sortBy = searchParams?.sortBy || 'newest';

  let productsToShow = allProducts.filter(product => {
    // Exclude the featured product from the main grid if it exists
    if (featuredProductInfo?.productId === product.id) {
        return false;
    }
    const searchMatch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery)
      : true;
    
    // If a category is selected, filter by it. Otherwise, show all.
    const categoryMatch = selectedCategory ? product.category === selectedCategory : true;
    
    return searchMatch && categoryMatch;
  });

  // Sort products
  productsToShow.sort((a, b) => {
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

  return (
    <div className="space-y-8">
      {featuredProductInfo?.product && (
        <FeaturedProductBanner 
            product={featuredProductInfo.product} 
            promoText={featuredProductInfo.promoText}
        />
      )}
      
      <CategoryBrowser categories={categories} />
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:flex-grow">
              <ProductSearch />
          </div>
          <div className="w-full sm:w-auto">
              <ProductSort />
          </div>
      </div>

      <ProductShowcase 
        products={productsToShow} 
        categories={categories}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
