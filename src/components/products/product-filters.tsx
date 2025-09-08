
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import type { ProductConditionMap } from '@/app/dashboard/manage-product-conditions/actions';
import { cn } from '@/lib/utils';
import { SheetFooter, SheetClose } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';

const MAX_PRICE = 50000;

interface ProductFiltersProps {
  categories: CategoryMap;
  conditions: ProductConditionMap;
}

export function ProductFilters({ categories, conditions }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const enabledConditions = Object.entries(conditions)
    .filter(([_, data]) => data.enabled)
    .map(([name]) => name);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || MAX_PRICE
  ]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedSubcategory(searchParams.get('subcategory') || 'all');
    setSelectedCondition(searchParams.get('condition') || 'all');
    setPriceRange([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || MAX_PRICE
    ]);
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    else params.delete('category');
    
    if (selectedSubcategory && selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    else params.delete('subcategory');
    
    if (selectedCondition && selectedCondition !== 'all') params.set('condition', selectedCondition);
    else params.delete('condition');

    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    else params.delete('minPrice');

    if (priceRange[1] < MAX_PRICE) params.set('maxPrice', priceRange[1].toString());
    else params.delete('maxPrice');
    
    router.push(`/?${params.toString()}`);
  };
  
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedCondition('all');
    setPriceRange([0, MAX_PRICE]);
    router.push('/');
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // When category changes, reset subcategory to prevent invalid combinations
    setSelectedSubcategory('all');
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
  }

  const enabledCategories = Object.entries(categories).filter(([_, catData]) => catData.enabled);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {enabledCategories.map(([catName]) => (
                  <SelectItem key={catName} value={catName}>{catName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select 
              onValueChange={handleSubcategoryChange} 
              value={selectedSubcategory}
              disabled={!selectedCategory || selectedCategory === 'all'}
            >
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">All Subcategories</SelectItem>
                {selectedCategory && selectedCategory !== 'all' && categories[selectedCategory as keyof typeof categories]?.subcategories
                  .filter(sub => sub.enabled)
                  .map(subcat => (
                    <SelectItem key={subcat.name} value={subcat.name}>{subcat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Condition</Label>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant={selectedCondition === 'all' ? 'destructive' : 'outline'}
                    onClick={() => setSelectedCondition('all')}
                    className="w-full col-span-2"
                >
                    Any Condition
                </Button>
                {enabledConditions.map((condition) => (
                    <Button
                        key={condition}
                        variant={selectedCondition === condition ? 'destructive' : 'outline'}
                        onClick={() => setSelectedCondition(condition)}
                        className="w-full"
                    >
                        {condition}
                    </Button>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Price Range</Label>
              <span className="text-sm text-muted-foreground">Rs {priceRange[0]} - Rs {priceRange[1] === MAX_PRICE ? `${MAX_PRICE}+` : priceRange[1]}</span>
            </div>
            <Slider
              min={0}
              max={MAX_PRICE}
              step={100}
              value={priceRange}
              onValueChange={setPriceRange}
              className="[&>span:first-child]:h-2 [&>span>span]:h-5 [&>span>span]:w-5 [&>span>span]:border-2"
            />
          </div>
      </CardContent>
       <CardFooter className="flex flex-col gap-2 !p-4 border-t">
          <SheetClose asChild>
            <Button variant="destructive" className="w-full" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button className="w-full" variant="ghost" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </SheetClose>
        </CardFooter>
    </Card>
  );
}
