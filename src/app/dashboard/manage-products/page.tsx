
import { ShieldAlert, List } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getManageableProducts } from './actions';
import { ManageProductList } from './manage-product-list';

export default async function ManageProductsPage() {
  if (mockUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  const products = await getManageableProducts();

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                    <List className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-headline">Manage Products</CardTitle>
                    <CardDescription>Edit, update status, or view all active and sold products.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <ManageProductList initialProducts={products} />
        </CardContent>
    </Card>
  );
}
