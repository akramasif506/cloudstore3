
import type { Product, Category } from '@/lib/types';
import { ProductGrid } from './product-grid';
import { Separator } from '../ui/separator';

interface ProductShowcaseProps {
  products: Product[];
  categories: Category[];
  selectedCategory?: string | null;
}

export function ProductShowcase({ products, categories, selectedCategory }: ProductShowcaseProps) {
  if (selectedCategory) {
    // If a category is selected, just show the grid for that category's products
    return <ProductGrid products={products} />;
  }

  // Group products by category
  const productsByCategory: { [key: string]: Product[] } = {};
  products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });
  
  // Only show categories that have products
  const categoriesWithProducts = categories.filter(cat => productsByCategory[cat.name]);

  return (
    <div className="space-y-12">
      {categoriesWithProducts.map(category => (
        <div key={category.name}>
          <h3 className="text-2xl font-bold font-headline mb-4">{category.name}</h3>
          <ProductGrid products={productsByCategory[category.name].slice(0, 6)} /> 
          <Separator className="my-8" />
        </div>
      ))}
    </div>
  );
}
