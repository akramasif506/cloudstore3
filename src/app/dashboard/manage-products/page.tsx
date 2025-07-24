
import { ShieldAlert, List, ArrowLeft, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getManageableProducts } from './actions';
import { ManageProductList } from './manage-product-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCategories } from '../manage-categories/actions';
import { ProductFilters } from './product-filters';
import { Suspense } from 'react';

export default async function ManageProductsPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    category?: string;
    subcategory?: string;
    from?: string;
    to?: string;
  };
}) {
  const products = await getManageableProducts(searchParams);
  const categories = await getCategories();

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                        <List className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-headline">Manage Products</CardTitle>
                        <CardDescription>Edit, update status, or view all active and sold products.</CardDescription>
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
            <ProductFilters categories={categories} />
            <div className="mt-8">
                <Suspense fallback={<div>Loading products...</div>}>
                    <ManageProductList products={products} categories={categories} />
                </Suspense>
            </div>
        </CardContent>
    </Card>
  );
}
