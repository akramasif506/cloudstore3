import { ProductFilters } from '@/components/products/product-filters';
import { ProductGrid } from '@/components/products/product-grid';
import { mockProducts } from '@/lib/data';

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <ProductFilters />
        </div>
      </div>
      <div className="lg:col-span-3">
        <ProductGrid products={mockProducts} />
      </div>
    </div>
  );
}
