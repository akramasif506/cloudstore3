
import { FeaturedProductBanner } from '@/components/products/featured-product-banner';
import { ProductSearch } from '@/components/products/product-search';
import { ProductSort } from '@/components/products/product-sort';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { Product } from '@/lib/types';
import { getFeaturedProduct } from './dashboard/manage-featured-product/actions';
import { getCategories } from './dashboard/manage-categories/actions';
import type { CategoryMap, Category as CategoryType } from './dashboard/manage-categories/actions';
import { CategoryBrowser } from '@/components/products/category-browser';
import { ProductShowcase } from '@/components/products/product-showcase';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { getPromoBanner } from './dashboard/manage-promo-banner/actions';
import { PromoBanner } from '@/components/products/promo-banner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

async function getProducts(): Promise<Product[]> {
  try {
    const { db } = initializeAdmin();
    const productsRef = db.ref('products');
    const snapshot = await productsRef.once('value');
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
    console.error("Error fetching products from Firebase with Admin SDK:", error);
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
  const promoBanner = await getPromoBanner();
  
  const categories = Object.entries(categoryMap)
    .filter(([_, catData]) => catData.enabled) // Filter for enabled categories
    .map(([name, catData]) => ({
      name,
      productCount: allProducts.filter(p => p.category === name).length,
  }));

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const selectedCategory = searchParams?.category;
  const selectedSubcategory = searchParams?.subcategory;
  const selectedCondition = searchParams?.condition;
  const minPrice = Number(searchParams?.minPrice) || 0;
  const maxPrice = Number(searchParams?.maxPrice);
  const sortBy = searchParams?.sortBy || 'newest';

  const hasActiveFilters = !!(searchQuery || selectedCategory || selectedSubcategory || selectedCondition || minPrice > 0 || maxPrice);

  let productsToShow = allProducts.filter(product => {
    if (featuredProductInfo?.productId === product.id) {
        return false;
    }
    const searchMatch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery) ||
        (product.displayId && product.displayId.toLowerCase().includes(searchQuery))
      : true;
    
    const categoryMatch = selectedCategory ? product.category === selectedCategory : true;
    const subcategoryMatch = selectedSubcategory ? product.subcategory === selectedSubcategory : true;
    const conditionMatch = selectedCondition ? product.condition === selectedCondition : true;
    const priceMatch = product.price >= minPrice && (maxPrice ? product.price <= maxPrice : true);

    return searchMatch && categoryMatch && subcategoryMatch && conditionMatch && priceMatch;
  });

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
      {promoBanner && !hasActiveFilters && (
        <PromoBanner banner={promoBanner} />
      )}

      {featuredProductInfo?.product && !hasActiveFilters && (
        <FeaturedProductBanner 
            product={featuredProductInfo.product} 
            promoText={featuredProductInfo.promoText}
        />
      )}
      
      {!hasActiveFilters && <CategoryBrowser categories={categories} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="hidden lg:block lg:sticky lg:top-24">
           <ProductFilters categories={categoryMap} />
        </div>
        <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
                <div className="w-full sm:flex-grow">
                    <ProductSearch />
                </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <div className="lg:hidden w-1/2 sm:w-auto">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    Filters
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <ProductFilters categories={categoryMap} />
                            </SheetContent>
                        </Sheet>
                    </div>
                    <div className="w-1/2 sm:w-auto">
                        <ProductSort />
                    </div>
                </div>
            </div>
          {hasActiveFilters ? (
             <ProductGrid 
                products={productsToShow} 
                adProducts={allProducts.filter(p => p.id !== featuredProductInfo?.productId).slice(0, 3)} 
              />
          ) : (
            <ProductShowcase 
              products={productsToShow} 
              categories={categories}
            />
          )}
        </div>
      </div>
    </div>
  );
}
