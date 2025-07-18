
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
import { ProductFilters } from '@/components/products/product-filters';
import { Card, CardContent } from '@/components/ui/card';
import { ProductGrid } from '@/components/products/product-grid';

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
    subcategory?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
  };
}) {
  const allProducts = await getProducts();
  const featuredProductInfo = await getFeaturedProduct();
  const categoryMap: CategoryMap = await getCategories();
  
  const categories: Category[] = Object.keys(categoryMap).map(name => ({
    name,
    imageUrl: `https://placehold.co/400x300.png?text=${encodeURIComponent(name)}`,
    productCount: allProducts.filter(p => p.category === name).length,
  }));

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const selectedCategory = searchParams?.category;
  const selectedSubcategory = searchParams?.subcategory;
  const selectedCondition = searchParams?.condition;
  const minPrice = Number(searchParams?.minPrice) || 0;
  const maxPrice = Number(searchParams?.maxPrice);
  const sortBy = searchParams?.sortBy || 'newest';

  // A specific search or subcategory filter will trigger the flat grid view.
  const useFlatGrid = !!(searchQuery || selectedSubcategory);

  let productsToShow = allProducts.filter(product => {
    // Exclude the featured product from the main grid if it exists
    if (featuredProductInfo?.productId === product.id) {
        return false;
    }
    const searchMatch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery)
      : true;
    
    const categoryMatch = selectedCategory ? product.category === selectedCategory : true;
    const subcategoryMatch = selectedSubcategory ? product.subcategory === selectedSubcategory : true;
    const conditionMatch = selectedCondition ? product.condition === selectedCondition : true;
    const priceMatch = product.price >= minPrice && (maxPrice ? product.price <= maxPrice : true);

    return searchMatch && categoryMatch && subcategoryMatch && conditionMatch && priceMatch;
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
      {featuredProductInfo?.product && !useFlatGrid && !selectedCategory && (
        <FeaturedProductBanner 
            product={featuredProductInfo.product} 
            promoText={featuredProductInfo.promoText}
        />
      )}
      
      {!useFlatGrid && <CategoryBrowser categories={categories} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-24">
           <ProductFilters categories={categoryMap} />
        </div>
        <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
                <div className="w-full sm:flex-grow">
                    <ProductSearch />
                </div>
                <div className="w-full sm:w-auto">
                    <ProductSort />
                </div>
            </div>
          {useFlatGrid ? (
             <ProductGrid 
                products={productsToShow} 
                adProducts={allProducts.filter(p => p.id !== featuredProductInfo?.productId).slice(0, 3)} 
              />
          ) : (
            <ProductShowcase 
              products={productsToShow} 
              categories={categories}
              selectedCategory={selectedCategory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
