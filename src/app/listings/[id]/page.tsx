
// src/app/listings/[id]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Tag, User, Building, ShieldCheck, Phone, Undo2 } from 'lucide-react';
import { CustomerFeedback } from '@/components/products/customer-feedback';
import type { Product } from '@/lib/types';
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

  if (!product || product.status !== 'active') {
    notFound();
  }
  
  const totalRating = product.reviews?.reduce((acc, review) => acc + review.rating, 0) || 0;
  const averageRating = product.reviews?.length > 0 ? (totalRating / product.reviews.length) : 0;
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const productUrl = `${appUrl}/listings/${product.id}`;


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
            <p className="text-sm text-muted-foreground mb-4">Product ID: {product.displayId}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>{product.category} &gt; {product.subcategory}</span>
                </div>
                {product.condition && (
                    <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{product.condition}</span>
                        </div>
                    </>
                )}
                 {product.reviews?.length > 0 && (
                    <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span>{averageRating.toFixed(1)} ({product.reviews.length} reviews)</span>
                        </div>
                    </>
                 )}
            </div>
            <p className="text-lg leading-relaxed">{product.description}</p>
        </div>
        <Separator className="my-8" />
        <div>
            <CustomerFeedback reviews={product.reviews || []} />
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            {product.status === 'active' && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-primary">Rs {product.price.toFixed(2)}</CardTitle>
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
                                <Button variant="link" className="text-sm p-0 h-auto">View Policy</Button>
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
            )}

            {product.status !== 'active' && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Listing Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-4 bg-muted rounded-md">
                           <p className="text-lg font-semibold capitalize">{product.status.replace('_', ' ')}</p>
                        </div>
                        {product.rejectionReason && (
                            <div className="mt-4 text-sm text-destructive border-l-4 border-destructive pl-3">
                                <strong>Rejection Reason:</strong> {product.rejectionReason}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
