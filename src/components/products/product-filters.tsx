
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
import { SlidersHorizontal, Star } from "lucide-react";
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import type { ProductConditionMap } from '@/app/dashboard/manage-product-conditions/actions';
import { ScrollArea } from '../ui/scroll-area';

const MAX_PRICE = 50000;

interface ProductFiltersProps {
  categories: CategoryMap;
  conditions: ProductConditionMap;
  onAction?: () => void;
}

export function ProductFilters({ categories, conditions, onAction }: ProductFiltersProps) {
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
  const [selectedRating, setSelectedRating] = useState(Number(searchParams.get('rating')) || 0);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedSubcategory(searchParams.get('subcategory') || 'all');
    setSelectedCondition(searchParams.get('condition') || 'all');
    setPriceRange([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || MAX_PRICE
    ]);
    setSelectedRating(Number(searchParams.get('rating')) || 0);
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
    
    if (selectedRating > 0) params.set('rating', selectedRating.toString());
    else params.delete('rating');
    
    router.push(`/?${params.toString()}`);
    if (onAction) onAction();
  };
  
  const handleResetFilters = () => {
    router.push('/');
    if (onAction) onAction();
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory('all');
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
  }

  const enabledCategories = Object.entries(categories).filter(([_, catData]) => catData.enabled);

  return (
    <Card className="border-0 shadow-none bg-transparent lg:border lg:shadow-sm lg:bg-card flex flex-col lg:max-h-[calc(100vh-8rem)]">
      <CardHeader className="p-0 mb-4 lg:p-6 lg:mb-0">
        <CardTitle className="flex items-center gap-2 text-base lg:text-2xl">
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <div className="lg:flex-1 lg:overflow-y-auto">
        <ScrollArea className="h-full">
            <div className="space-y-6 px-0.5 lg:px-6">
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
                
                {enabledConditions.length > 1 && (
                <div className="space-y-2">
                    <Label>Condition</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={selectedCondition === 'all' ? 'default' : 'outline'}
                            onClick={() => setSelectedCondition('all')}
                            className="w-full col-span-2"
                        >
                            Any Condition
                        </Button>
                        {enabledConditions.map((condition) => (
                            <Button
                                key={condition}
                                variant={selectedCondition === condition ? 'default' : 'outline'}
                                onClick={() => setSelectedCondition(condition)}
                                className="w-full"
                            >
                                {condition}
                            </Button>
                        ))}
                    </div>
                </div>
                )}

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

                <div className="space-y-2">
                <Label>Rating</Label>
                <div className="grid grid-cols-2 gap-2">
                    {[4, 3, 2, 1].map((rating) => (
                    <Button
                        key={rating}
                        variant={selectedRating === rating ? 'default' : 'outline'}
                        onClick={() => setSelectedRating(prev => prev === rating ? 0 : rating)}
                        className="w-full"
                    >
                        <div className="flex items-center gap-1">
                        {rating} <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> & up
                        </div>
                    </Button>
                    ))}
                </div>
                </div>
            </div>
        </ScrollArea>
      </div>
      <CardFooter className="p-0 pt-6 lg:p-6 lg:pt-4">
        <div className="flex w-full flex-col gap-2">
            <Button variant="default" className="w-full" onClick={handleApplyFilters}>
                Apply Filters
            </Button>
            <Button className="w-full" variant="ghost" onClick={handleResetFilters}>
                Reset Filters
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
