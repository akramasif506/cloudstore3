
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface ProductCardProps {
  product: Product;
  showViewButton?: boolean;
}

export function ProductCard({ product, showViewButton = false }: ProductCardProps) {
  const imageUrl = product.imageUrl || 'https://placehold.co/400x300.png';
  return (
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <Link href={`/listings/${product.id}`} className="flex flex-col flex-grow">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-square">
              <Image
                src={imageUrl}
                alt={product.name || 'Product image'}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
               <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-sm">
                {product.displayId}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-grow">
            <CardTitle className="text-base font-headline mb-1 truncate leading-tight">{product.name}</CardTitle>
            <p className="text-lg font-bold text-primary">Rs {product.price.toFixed(2)}</p>
          </CardContent>
        </Link>
        <CardFooter className="p-3 bg-secondary/30 flex justify-between items-center">
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
