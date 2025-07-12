import type { Product } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';

interface RecentProductsProps {
  products: Product[];
}

export function RecentProducts({ products }: RecentProductsProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Link href={`/listings/${product.id}`} key={product.id}>
          <div className="flex items-center gap-4 hover:bg-muted/50 p-2 rounded-lg transition-colors">
            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint="product image"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
