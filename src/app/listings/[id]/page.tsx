
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Tag } from 'lucide-react';
import { CustomerFeedback } from '@/components/products/customer-feedback';
import type { Product } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';
import { AddToCartButtons } from './add-to-cart-buttons';


async function getProduct(id: string): Promise<Product | null> {
  if (!db) {
    return null;
  }
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `products/${id}`));
    if (snapshot.exists()) {
      const productData = snapshot.val();
      return { ...productData, id }; // Ensure id is part of the returned object
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}


export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product || product.status !== 'active') {
    notFound();
  }
  
  const totalRating = product.reviews?.reduce((acc, review) => acc + review.rating, 0) || 0;
  const averageRating = product.reviews?.length > 0 ? (totalRating / product.reviews.length) : 0;


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
            <h1 className="text-4xl font-bold font-headline mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>{product.category} &gt; {product.subcategory}</span>
                </div>
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">Rs {product.price.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddToCartButtons product={product} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">About CloudStore</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        All products on CloudStore are carefully curated and sold directly by us. We ensure quality and authenticity for every item.
                    </p>
                     <Link href="/contact" className="w-full">
                        <span className="inline-block w-full text-center py-2 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium">Contact Us</span>
                     </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
