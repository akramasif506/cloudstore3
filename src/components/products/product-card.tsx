import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.imageUrl || 'https://placehold.co/400x300.png';
  return (
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <Link href={`/listings/${product.id}`}>
          <CardHeader className="p-0">
            <div className="relative w-full aspect-video">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg font-headline mb-2 truncate">{product.name}</CardTitle>
            <p className="text-2xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
          </CardContent>
        </Link>
        {product.seller && (
          <CardFooter className="p-4 bg-secondary/30">
            <Link href={`/users/${product.seller.id}`} className="flex items-center space-x-2 hover:underline">
              <Avatar className="h-8 w-8">
                <AvatarImage src={product.seller.avatarUrl} alt={product.seller.name} data-ai-hint="profile avatar" />
                <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{product.seller.name}</span>
            </Link>
          </CardFooter>
        )}
      </Card>
  );
}
