
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { CategoryInfo } from '@/lib/types';


interface CategoryBrowserProps {
  categories: CategoryInfo[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const handleCategorySelect = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    // when a category is selected, we want to clear other filters
    params.delete('q');
    params.delete('subcategory');
    params.delete('condition');
    params.delete('minPrice');
    params.delete('maxPrice');
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-4">Browse Categories</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex gap-4 pb-4">
          <Button
            variant={!selectedCategoryId ? 'default' : 'secondary'}
            onClick={() => handleCategorySelect(null)}
            className="h-auto shrink-0"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? 'default' : 'secondary'}
              onClick={() => handleCategorySelect(category.id)}
              className="h-auto shrink-0"
            >
              {category.name} ({category.productCount})
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
