
"use client";

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getMyListings } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MyListingsClient() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (user?.id) {
        setLoading(true);
        const userProducts = await getMyListings(user.id);
        setProducts(userProducts);
        setLoading(false);
      } else if (user === null) {
        // If user is explicitly null (not just loading), stop loading.
        setLoading(false);
        setProducts([]);
      }
    }

    fetchProducts();
  }, [user]);

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

      {loading ? (
        <div className="flex justify-center items-center p-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : products.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              <CardTitle className="text-lg text-amber-700">Awaiting Review</CardTitle>
            </div>
            <CardDescription>
              The following items have been submitted and are awaiting approval from our team. They are not yet visible to other users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductGrid products={products} />
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center text-center py-20">
          <CardHeader>
            <CardTitle>No Listings Yet</CardTitle>
            <CardDescription>You haven't listed any items for sale.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/listings/new">Create a Listing</Link>
             </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
