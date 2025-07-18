
"use client";

import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, Loader2, Frown, CheckCircle, XCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { getMyListings } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function MyListingsClient() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      getMyListings(user.id)
        .then(userProducts => {
          setProducts(userProducts);
        })
        .catch(error => {
          console.error("Failed to fetch listings:", error);
          setProducts([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setProducts([]);
      setIsLoading(false);
    }
  }, [user]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
     return (
        <Card className="flex flex-col items-center justify-center text-center py-20">
          <CardHeader>
             <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
               <Frown className="h-12 w-12 text-muted-foreground" />
             </div>
            <CardTitle>You're Not Logged In</CardTitle>
            <CardDescription>You must be logged in to view your listings.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={() => router.push('/login?redirect=/my-listings')}>
                Go to Login
             </Button>
          </CardContent>
        </Card>
      );
  }

  const pendingProducts = products.filter(p => p.status === 'pending_review');
  const activeProducts = products.filter(p => p.status === 'active');
  const rejectedProducts = products.filter(p => p.status === 'rejected');

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">My Listings</h1>
            <p className="text-muted-foreground">Manage your submitted items.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/listings/new">Submit a New Item</Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center py-20">
          <CardHeader>
            <CardTitle>No Listings Yet</CardTitle>
            <CardDescription>You haven't submitted any items for sale.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/listings/new">Submit Your First Item</Link>
             </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pendingProducts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-5 w-5" />
                  <CardTitle className="text-lg text-amber-700">Awaiting Review</CardTitle>
                </div>
                <CardDescription>
                  These items have been submitted and are awaiting approval from our team. They are not yet visible to other users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductGrid products={pendingProducts} showViewButton={true} />
              </CardContent>
            </Card>
          )}

          {activeProducts.length > 0 && (
             <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <CardTitle className="text-lg text-green-700">Active Listings</CardTitle>
                </div>
                <CardDescription>
                  These items have been approved and are now available for purchase on CloudStore.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductGrid products={activeProducts} showViewButton={true} />
              </CardContent>
            </Card>
          )}

          {rejectedProducts.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <CardTitle className="text-lg text-destructive">Rejected Listings</CardTitle>
                </div>
                <CardDescription>
                  These items were not approved. Please review the feedback and resubmit if necessary.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rejectedProducts.map(product => (
                    <div key={product.id}>
                      <ProductGrid products={[product]} showViewButton={true} />
                       <Alert variant="destructive" className="mt-2 text-sm">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Admin Feedback</AlertTitle>
                        <AlertDescription>
                          {product.rejectionReason || "No reason provided."}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
