
// src/app/dashboard/manage-featured-product/page.tsx
import { ShieldAlert, Star } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getManageableProducts } from '../manage-products/actions';
import { getFeaturedProduct } from './actions';
import { FeaturedProductForm } from './featured-product-form';


export default async function ManageFeaturedProductPage() {
  if (mockUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const allProducts = await getManageableProducts();
  const featuredProduct = await getFeaturedProduct();

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <FeaturedProductForm allProducts={allProducts} currentFeaturedProduct={featuredProduct} />
      </CardContent>
    </Card>
  );
}
