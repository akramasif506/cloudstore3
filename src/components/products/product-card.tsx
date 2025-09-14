
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Eye, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";

interface ProductCardProps {
  product: Product;
  showViewButton?: boolean;
}

export function ProductCard({ product, showViewButton = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const imageUrl = product.imageUrl || 'https://placehold.co/400x300.png';
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isDiscounted ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    addToCart(product, 1);
    toast({
      title: "Added to cart!",
      description: `${product.name} is now in your cart.`,
      action: (
        <ToastAction altText="View cart" asChild>
          <Link href="/cart">View Cart</Link>
        </ToastAction>
      ),
    });
  };

  return (
      <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 shadow-sm hover:shadow-xl">
        <Link href={`/listings/${product.id}`} className="flex flex-col flex-grow">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-square overflow-hidden">
              <Image
                src={imageUrl}
                alt={product.name || 'Product image'}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                data-ai-hint="product image"
              />
               <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-sm">
                {product.displayId}
              </div>
              {isDiscounted && (
                 <Badge variant="destructive" className="absolute top-2 left-2">
                    {discountPercent}% OFF
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow flex flex-col">
            <CardTitle className="text-lg font-headline mb-2 leading-tight flex-grow">{product.name}</CardTitle>
            <div className="flex flex-col">
                {isDiscounted && (
                    <p className="text-sm text-muted-foreground line-through">Rs {product.originalPrice!.toFixed(2)}</p>
                )}
                <p className="text-xl font-bold text-destructive">Rs {product.price.toFixed(2)}</p>
            </div>
          </CardContent>
        </Link>
        <CardFooter className="p-4 bg-background flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={handleAddToCart} className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
            {showViewButton && (
              <Button asChild variant="outline" size="sm" className="ml-2">
                <Link href={`/listings/${product.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            )}
        </CardFooter>
      </Card>
  );
}
