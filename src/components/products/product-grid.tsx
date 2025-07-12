import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { Frown } from 'lucide-react';
import { Separator } from '../ui/separator';

interface ProductGridProps {
  products: Product[];
  adProducts?: Product[];
}

export function ProductGrid({ products, adProducts = [] }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center text-center py-20 bg-muted/50 rounded-lg">
          <Frown className="h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold">No Products Found</h3>
          <p className="text-muted-foreground">Try adjusting your filters to find what you're looking for.</p>
        </div>

        {adProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold font-headline mb-4">You might also like</h2>
             <Separator />
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                {adProducts.map((product) => (
                    <ProductCard key={`ad-${product.id}`} product={product} />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
