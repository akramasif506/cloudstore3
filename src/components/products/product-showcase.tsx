
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { Separator } from '../ui/separator';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
              opts={{ align: "start", loop: false }}
              className="relative"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {categoryProducts.map((product) => (
                  <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/50 hover:bg-background" />
            </Carousel>
            {index < categoriesToShow.length - 1 && <Separator className="mt-8" />}
          </div>
        )
      })}
    </div>
  );
}
