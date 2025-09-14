
// src/app/dashboard/pending-products/page.tsx
import { ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';
import { getPendingProducts } from './actions';
import { PendingProductList } from '@/components/dashboard/pending-products/pending-product-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCategories } from '../manage-categories/actions';
import { getProductConditions } from '../manage-product-conditions/actions';
import { PendingProductFilters } from '@/components/dashboard/pending-products/pending-product-filters';
import { Suspense } from 'react';

export default async function PendingProductsPage({
  searchParams
}: {
  searchParams?: {
    from?: string;
    to?: string;
    contactNumber?: string;
  };
}) {
  const [pendingProducts, categories, conditions] = await Promise.all([
    getPendingProducts(searchParams),
    getCategories(),
    getProductConditions(),
  ]);

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-headline">Pending Products</CardTitle>
                        <CardDescription>Review and approve new listings submitted by users.</CardDescription>
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
            <Suspense fallback={null}>
                <PendingProductFilters />
            </Suspense>
            <PendingProductList initialProducts={pendingProducts} categories={categories} conditions={conditions} />
        </CardContent>
    </Card>
  );
}
