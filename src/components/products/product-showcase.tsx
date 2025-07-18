
import type { Product, Category } from '@/lib/types';
import { ProductGrid } from './product-grid';
import { Separator } from '../ui/separator';

interface ProductShowcaseProps {
  products: Product[];
  categories: Category[];
  selectedCategory?: string | null;
}

export function ProductShowcase({ products, categories, selectedCategory }: ProductShowcaseProps) {

  // Group products by category
  const productsByCategory: { [key: string]: Product[] } = {};
  products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  // If a category is selected, just show that one. Otherwise, show all categories that have products.
  const categoriesToShow = selectedCategory
    ? categories.filter(cat => cat.name === selectedCategory && productsByCategory[cat.name]?.length > 0)
    : categories.filter(cat => productsByCategory[cat.name]?.length > 0);


  return (
    <div className="space-y-12">
      {categoriesToShow.map((category, index) => {
        if (!productsByCategory[category.name] || productsByCategory[category.name].length === 0) {
          return null;
        }
        return (
          <div key={category.name}>
            <h3 className="text-2xl font-bold font-headline mb-4">{category.name}</h3>
            <ProductGrid products={productsByCategory[category.name].slice(0, 6)} /> 
            {index < categoriesToShow.length - 1 && <Separator className="mt-8" />}
          </div>
        )
      })}
    </div>
  );
}
