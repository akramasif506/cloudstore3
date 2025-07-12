
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.imageUrl || 'https://placehold.co/400x300.png';
  return (
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <Link href={`/listings/${product.id}`} className="flex flex-col flex-grow">
          <CardHeader className="p-0">
            <div className="relative w-full aspect-video">
              <Image
                src={imageUrl}
                alt={product.name || 'Product image'}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg font-headline mb-2 truncate">{product.name}</CardTitle>
            <p className="text-2xl font-bold text-primary">Rs {product.price.toFixed(2)}</p>
          </CardContent>
        </Link>
        <CardFooter className="p-4 bg-secondary/30">
             <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{product.seller.name}</span>
            </div>
        </CardFooter>
      </Card>
  );
}
