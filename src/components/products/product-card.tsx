
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProductCardProps {
  product: Product;
  showViewButton?: boolean;
}

export function ProductCard({ product, showViewButton = false }: ProductCardProps) {
  const imageUrl = product.imageUrl || 'https://placehold.co/400x300.png';
  const isDiscounted = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = isDiscounted ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

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
                 <Badge variant="destructive" className="absolute top-2 left-2 bg-accent text-accent-foreground">
                    {discountPercent}% OFF
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg font-headline mb-1 truncate leading-tight">{product.name}</CardTitle>
            <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-primary">Rs {product.price.toFixed(2)}</p>
                {isDiscounted && (
                    <p className="text-sm text-muted-foreground line-through">Rs {product.originalPrice!.toFixed(2)}</p>
                )}
            </div>
          </CardContent>
        </Link>
        <CardFooter className="p-4 bg-background flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">CloudStore</span>
            </div>
            {showViewButton && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/listings/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </Button>
            )}
        </CardFooter>
      </Card>
  );
}
