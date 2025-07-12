
import { ProductGrid } from '@/components/products/product-grid';
import { mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { get, ref } from 'firebase/database';

async function getUserProducts(): Promise<Product[]> {
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
      }));
      // Filter products by seller ID in the code
      return allProducts.filter(product => product.seller && product.seller.id === mockUser.id);
    }
    return [];
  } catch (error) {
    console.error("Error fetching user products from Firebase:", error);
    return [];
  }
}

export default async function MyListingsPage() {
  const userProducts = await getUserProducts();

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
