// src/app/dashboard/pending-products/page.tsx
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { getPendingProducts } from './actions';
import { mockUser } from '@/lib/data';
import { PendingProductList } from './pending-product-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PendingProductsPage() {
  // Simple role check, in a real app this would be more robust
  if (mockUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  const pendingProducts = await getPendingProducts();

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-headline">Pending Products</CardTitle>
                    <CardDescription>Review and approve new listings submitted by users.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <PendingProductList initialProducts={pendingProducts} />
        </CardContent>
    </Card>
  );
}
