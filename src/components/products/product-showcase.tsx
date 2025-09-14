
import type { Product } from '@/lib/types';
import { ProductGrid } from './product-grid';
import { Separator } from '../ui/separator';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';

interface CategoryInfo {
  id: string;
  name: string;
  productCount: number;
}

interface ProductShowcaseProps {
  products: Product[];
  categories: CategoryInfo[];
  categoryMap: CategoryMap;
}

export function ProductShowcase({ products, categories, categoryMap }: ProductShowcaseProps) {

  // Group products by category ID
  const productsByCategory: { [key: string]: Product[] } = {};
  products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  // Use the categories array which is already sorted and contains names
  const categoriesToShow = categories.filter(cat => productsByCategory[cat.id]?.length > 0);

  return (
    <div className="space-y-12">
      {categoriesToShow.map((category, index) => {
        if (!productsByCategory[category.id] || productsByCategory[category.id].length === 0) {
          return null;
        }
        return (
          <div key={category.id}>
            <h3 className="text-2xl font-bold font-headline mb-4">{category.name}</h3>
            <ProductGrid products={productsByCategory[category.id].slice(0, 6)} /> 
            {index < categoriesToShow.length - 1 && <Separator className="mt-8" />}
          </div>
        )
      })}
    </div>
  );
}
