
// src/app/listings/[id]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Tag, User, Building, ShieldCheck, Phone, Undo2, ArrowLeft, FilePlus2, Package } from 'lucide-react';
import { CustomerFeedback } from '@/components/products/customer-feedback';
import type { Product, Review } from '@/lib/types';
import { AddToCartButtons } from './add-to-cart-buttons';
import { ShareButtons } from './share-buttons';
import { headers } from 'next/headers';
import { getReturnPolicy } from '@/app/dashboard/manage-returns/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getProductForDisplay } from './actions';


export default async function ListingDetailPage({ params }: { params: { id:string } }) {
  const productPromise = getProductForDisplay(params.id);
  const returnPolicyPromise = getReturnPolicy();

  const [product, returnPolicy] = await Promise.all([productPromise, returnPolicyPromise]);

  if (!product) {
    notFound();
  }
  
  // Ensure reviews is an array before using array methods
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
  
  const heads = headers();
  const host = heads.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const productUrl = `${siteUrl}/listings/${product.id}`;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <Card className="overflow-hidden">
            <div className="relative w-full aspect-[4/3]">
                <Image
                src={product.imageUrl || 'https://placehold.co/800x600.png'}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product photo"
                />
            </div>
        </Card>
        <div className="mt-8">
            <h1 className="text-4xl font-bold font-headline mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground">Product ID: {product.displayId}</p>

            <div className="flex items-baseline gap-2 mt-4">
              <p className="text-3xl font-bold text-destructive">Rs {product.price.toFixed(2)}</p>
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-lg text-muted-foreground line-through">Rs {product.originalPrice.toFixed(2)}</p>
              )}
            </div>

            {reviews.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
            )}
            
            <Separator className="my-6" />

            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{product.description}</p>
            </div>
            
            <Card className="mt-6 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                 <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-semibold">{product.category} &gt; {product.subcategory}</span>
                </div>
                {product.condition && (
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                         <span className="text-muted-foreground">Condition:</span>
                        <span className="font-semibold">{product.condition}</span>
                    </div>
                )}
                {product.stock !== undefined && (
                     <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="font-semibold">{product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}</span>
                    </div>
                )}
              </CardContent>
            </Card>

        </div>
        <Separator className="my-8" />
        <div>
            <CustomerFeedback reviews={reviews} />
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            {product.status === 'active' && product.stock !== undefined && product.stock > 0 ? (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddToCartButtons product={product} />
                        </CardContent>
                    </Card>
                    {returnPolicy?.isEnabled && (
                    <Card>
                        <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <Undo2 className="h-8 w-8 text-primary" />
                            <div>
                            <h3 className="font-semibold">{returnPolicy.returnWindowDays > 0 ? `${returnPolicy.returnWindowDays}-Day Returns` : 'Returns Accepted'}</h3>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button size="sm">View Policy</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                <div className="prose prose-sm dark:prose-invert">
                                    <h4>Return Policy</h4>
                                    <p>{returnPolicy.policyText}</p>
                                </div>
                                </PopoverContent>
                            </Popover>
                            </div>
                        </div>
                        </CardContent>
                    </Card>
                    )}
                    <ShareButtons productName={product.name} productUrl={productUrl} />
                </>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>Listing Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-4 bg-muted rounded-md">
                           <p className="text-lg font-semibold capitalize">{product.status === 'sold' || (product.stock !== undefined && product.stock <= 0) ? 'Sold Out' : product.status.replace('_', ' ')}</p>
                        </div>
                        {product.rejectionReason && (
                            <div className="mt-4 text-sm text-destructive border-l-4 border-destructive pl-3">
                                <strong>Rejection Reason:</strong> {product.rejectionReason}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                        <Button asChild variant="outline">
                            <Link href="/my-listings">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to My Listings
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href="/listings/new">
                                <FilePlus2 className="mr-2 h-4 w-4" />
                                Submit Another Item
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
