
import { FeaturedProductBanner } from '@/components/products/featured-product-banner';
import { ProductSearch } from '@/components/products/product-search';
import { ProductSort } from '@/components/products/product-sort';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { Product, Review } from '@/lib/types';
import { getFeaturedProduct } from './dashboard/manage-featured-product/actions';
import { getCategories } from './dashboard/manage-categories/actions';
import type { CategoryMap, Category as CategoryType } from './dashboard/manage-categories/actions';
import { CategoryBrowser } from '@/components/products/category-browser';
import { ProductShowcase } from '@/components/products/product-showcase';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { getPromoBanner } from './dashboard/manage-promo-banner/actions';
import { getProductConditions } from './dashboard/manage-product-conditions/actions';
import { PromoBanner } from '@/components/products/promo-banner';
import { MobileFilterSheet } from '@/components/products/mobile-filter-sheet';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ServerCrash } from 'lucide-react';


async function getProducts(): Promise<{ products: Product[], error?: string }> {
  try {
    const { db } = initializeAdmin();
    const productsRef = db.ref('products');
    const snapshot = await productsRef.once('value');
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const allProducts: Product[] = Object.keys(productsData).map(key => {
        const product = {
            ...productsData[key],
            id: key,
            price: Number(productsData[key].price) || 0,
            imageUrl: productsData[key].imageUrl || 'https://placehold.co/400x300.png',
        };
        // Convert reviews from object to array
        if (product.reviews && typeof product.reviews === 'object') {
            product.reviews = Object.values(product.reviews) as Review[];
        } else {
            product.reviews = [];
        }
        return product;
      });
      return { products: allProducts.filter(product => product.status === 'active' && (product.stock === undefined || product.stock > 0)) };
    }
    return { products: [] };
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    if (error instanceof Error && error.message.includes('credentials')) {
        return { products: [], error: error.message };
    }
    return { products: [] };
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
    rating?: string;
  };
}) {
  const { products: allProducts, error: productsError } = await getProducts();
  const featuredProductInfo = await getFeaturedProduct();
  const categoryMap: CategoryMap = await getCategories();
  const promoBanner = await getPromoBanner();
  const conditions = await getProductConditions();
  
  const categories = Object.values(categoryMap)
    .filter(cat => cat.enabled) // Filter for enabled categories
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      productCount: allProducts.filter(p => p.category === cat.id).length,
  }));

  const searchQuery = searchParams?.q?.toLowerCase() || '';
  const selectedCategoryId = searchParams?.category;
  const selectedSubcategory = searchParams?.subcategory;
  const selectedCondition = searchParams?.condition;
  const minPrice = Number(searchParams?.minPrice) || 0;
  const maxPrice = Number(searchParams?.maxPrice);
  const sortBy = searchParams?.sortBy || 'newest';
  const minRating = Number(searchParams?.rating) || 0;

  const hasActiveFilters = !!(searchQuery || selectedCategoryId || selectedSubcategory || selectedCondition || minPrice > 0 || maxPrice || minRating > 0);

  let productsToShow = allProducts.filter(product => {
    const searchMatch = searchQuery
      ? product.name.toLowerCase().includes(searchQuery) || 
        product.description.toLowerCase().includes(searchQuery) ||
        (product.displayId && product.displayId.toLowerCase().includes(searchQuery))
      : true;
    
    const categoryMatch = selectedCategoryId ? product.category === selectedCategoryId : true;
    const subcategoryMatch = selectedSubcategory ? product.subcategory === selectedSubcategory : true;
    const conditionMatch = selectedCondition ? product.condition === selectedCondition : true;
    const priceMatch = product.price >= minPrice && (maxPrice ? product.price <= maxPrice : true);

    const totalRating = product.reviews?.reduce((acc, review) => acc + review.rating, 0) || 0;
    const averageRating = product.reviews?.length > 0 ? (totalRating / product.reviews.length) : 0;
    const ratingMatch = minRating > 0 ? averageRating >= minRating : true;

    return searchMatch && categoryMatch && subcategoryMatch && conditionMatch && priceMatch && ratingMatch;
  });

  // Sort products based on the sortBy parameter.
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
  
  // Conditionally keep featured products at the top only if no sort order is specified and no filters are active.
  if (sortBy === 'newest' && !hasActiveFilters) {
      const featured = productsToShow.filter(p => p.isFeatured);
      const regular = productsToShow.filter(p => !p.isFeatured);
      productsToShow = [...featured, ...regular];
  }

  if (productsError) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Server Configuration Error</AlertTitle>
                <AlertDescription>
                   Could not connect to the database. Please ensure your Firebase Admin credentials are correctly set up in your <strong>.env</strong> file. You can check the status on the <Link href="/config-status" className="font-semibold">Configuration Status page</Link>.
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      {featuredProductInfo && featuredProductInfo.product && !hasActiveFilters && (
        <FeaturedProductBanner product={featuredProductInfo.product} promoText={featuredProductInfo.promoText} />
      )}

      {promoBanner && !hasActiveFilters && (
        <PromoBanner banner={promoBanner} />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="hidden lg:block lg:sticky lg:top-24">
           <ProductFilters categories={categoryMap} conditions={conditions} />
        </div>
        <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center mb-8">
                <div className="flex-grow w-full md:w-auto">
                    <ProductSearch />
                </div>
                 <div className="flex gap-4 w-full sm:w-auto ml-auto">
                    <div className="lg:hidden w-1/2 sm:w-auto">
                        <MobileFilterSheet categories={categoryMap} conditions={conditions} />
                    </div>
                    <div className="w-1/2 sm:w-auto">
                        <ProductSort />
                    </div>
                </div>
            </div>

            <div className="mb-8">
              <CategoryBrowser categories={categories} />
            </div>

          {hasActiveFilters ? (
             <ProductGrid 
                products={productsToShow} 
                adProducts={allProducts.filter(p => !productsToShow.some(p2 => p2.id === p.id)).slice(0, 5)} 
              />
          ) : (
            <ProductShowcase 
              products={productsToShow} 
              categories={categories}
              categoryMap={categoryMap}
            />
          )}
        </div>
      </div>
    </div>
  );
}
