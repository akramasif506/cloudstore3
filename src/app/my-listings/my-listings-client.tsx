
"use client";

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, Loader2, Frown } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getMyListings } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function MyListingsClient() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect runs when the authentication state changes.
    if (authLoading) {
      // If auth is still loading, do nothing yet.
      return;
    }

    if (user?.id) {
      // If there is a user, fetch their products.
      setLoading(true);
      getMyListings(user.id)
        .then(userProducts => {
          setProducts(userProducts);
        })
        .catch(error => {
          console.error("Failed to fetch listings:", error);
          setProducts([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // If there is no user, clear products and stop loading.
      setProducts([]);
      setLoading(false);
    }
  }, [user, authLoading]);

  // Combined loading state
  const isLoading = authLoading || loading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // This is the state when auth has loaded, but there's no user.
     return (
        <Card className="flex flex-col items-center justify-center text-center py-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Frown /> You're Not Logged In</CardTitle>
            <CardDescription>You must be logged in to view your listings.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={() => router.push('/login')}>
                Go to Login
             </Button>
          </CardContent>
        </Card>
      );
  }

  // This is the state when the user is logged in.
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

      {products.length > 0 ? (
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
