
// src/components/products/featured-product-banner.tsx
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ArrowRight, Sparkles, Star } from "lucide-react";

interface FeaturedProductBannerProps {
    product: Product;
    promoText: string;
}

export function FeaturedProductBanner({ product, promoText }: FeaturedProductBannerProps) {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;
    
    return (
        <Card className="overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary">
            <div className="grid md:grid-cols-2">
                <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold font-headline text-primary">{promoText}</h2>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold font-headline">{product.name}</h3>
                    
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold">{averageRating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({reviews.length} reviews)</span>
                        </div>
                    )}
                    
                    <p className="mt-4 text-muted-foreground line-clamp-3">{product.description}</p>
                    
                    <div className="flex items-baseline gap-2 mt-4">
                      <p className="text-3xl font-bold text-primary">Rs {product.price.toFixed(2)}</p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-lg text-muted-foreground line-through">Rs {product.originalPrice.toFixed(2)}</p>
                      )}
                    </div>
                    
                    <div className="mt-6">
                        <Button asChild size="lg">
                            <Link href={`/listings/${product.id}`}>
                                View Deal <ArrowRight className="ml-2"/>
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="relative min-h-[250px] md:min-h-0">
                    <Image 
                        src={product.imageUrl} 
                        alt={product.name}
                        fill
                        className="object-cover"
                        data-ai-hint="promotional product"
                    />
                </div>
            </div>
        </Card>
    )
}
