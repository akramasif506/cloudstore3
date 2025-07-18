
"use client";

import type { Category } from '@/lib/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CategoryBrowserProps {
  categories: Category[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category');

  const handleCategorySelect = (categoryName: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-4">Browse Categories</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex gap-4 pb-4">
          <Button
            variant={!selectedCategory ? 'default' : 'secondary'}
            onClick={() => handleCategorySelect(null)}
            className="h-auto shrink-0"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? 'default' : 'secondary'}
              onClick={() => handleCategorySelect(category.name)}
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
