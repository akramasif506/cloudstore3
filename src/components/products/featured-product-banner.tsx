
// src/components/products/featured-product-banner.tsx
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedProductBannerProps {
    product: Product;
    promoText: string;
}

export function FeaturedProductBanner({ product, promoText }: FeaturedProductBannerProps) {
    return (
        <Card className="overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary">
            <div className="grid md:grid-cols-2">
                <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold font-headline text-primary">{promoText}</h2>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold font-headline">{product.name}</h3>
                    <p className="mt-2 text-muted-foreground line-clamp-3">{product.description}</p>
                    <p className="text-3xl font-bold text-primary my-4">Rs {product.price.toFixed(2)}</p>
                    <div className="mt-2">
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
