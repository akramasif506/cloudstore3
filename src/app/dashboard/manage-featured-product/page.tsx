

// src/app/dashboard/manage-featured-product/page.tsx
import { ShieldAlert, Star, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getManageableProducts } from '../manage-products/actions';
import { getFeaturedProduct } from './actions';
import { FeaturedProductForm } from './featured-product-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ManageFeaturedProductPage() {
  const allProducts = await getManageableProducts();
  const featuredProduct = await getFeaturedProduct();

  return (
    <Card>
      <CardHeader>
         <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Featured Product</CardTitle>
                <CardDescription>
                  Select a product to feature prominently on the home page.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <FeaturedProductForm allProducts={allProducts} currentFeaturedProduct={featuredProduct} />
      </CardContent>
    </Card>
  );
}
