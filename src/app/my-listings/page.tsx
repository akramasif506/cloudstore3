import { ProductGrid } from '@/components/products/product-grid';
import { mockProducts, mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function MyListingsPage() {
  const userProducts = mockProducts.filter(p => p.seller.id === mockUser.id);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">My Listings</h1>
              <p className="text-muted-foreground">Manage your items for sale.</p>
            </div>
          </div>
      </div>

      {userProducts.length > 0 ? (
        <ProductGrid products={userProducts} />
      ) : (
        <Card className="flex flex-col items-center justify-center text-center py-20">
            <CardHeader>
                <CardTitle>No Listings Yet</CardTitle>
                <CardDescription>You haven't listed any items for sale.</CardDescription>
            </CardHeader>
        </Card>
      )}
    </div>
  );
}
