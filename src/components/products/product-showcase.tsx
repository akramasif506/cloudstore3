import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { Separator } from '../ui/separator';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
        const categoryProducts = productsByCategory[category.id];
        if (!categoryProducts || categoryProducts.length === 0) {
          return null;
        }

        return (
          <div key={category.id}>
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="text-2xl font-bold font-headline">{category.name}</h3>
               <Button asChild variant="link" className="text-primary">
                  <Link href={`/?category=${category.id}`}>
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: categoryProducts.length > 5,
              }}
              className="w-full"
            >
              <CarouselContent>
                {categoryProducts.map((product) => (
                  <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="p-1 h-full">
                      <ProductCard product={product} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden lg:flex" />
              <CarouselNext className="hidden lg:flex" />
            </Carousel>
            {index < categoriesToShow.length - 1 && <Separator className="mt-8" />}
          </div>
        )
      })}
    </div>
  );
}
