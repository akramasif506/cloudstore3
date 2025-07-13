
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const categories = {
  'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
  'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
  'Cloths': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
  'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  'Outdoor & Sports': ['Bikes', 'Camping Gear', 'Fitness'],
  'Grocery': ['Snacks', 'Beverages', 'Pantry Staples'],
  'Other': ['Miscellaneous'],
};

const conditions = ['New', 'Like New', 'Used'];

const MAX_PRICE = 50000;

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || 'all');
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || MAX_PRICE
  ]);

  useEffect(() => {
    // When category changes, reset subcategory if it's not valid for the new category
    if (selectedCategory !== 'all' && !categories[selectedCategory as keyof typeof categories]?.includes(selectedSubcategory)) {
      setSelectedSubcategory('all');
    }
  }, [selectedCategory, selectedSubcategory]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    else params.delete('category');
    
    if (selectedSubcategory && selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    else params.delete('subcategory');
    
    if (selectedCondition && selectedCondition !== 'all') params.set('condition', selectedCondition);
    else params.delete('condition');

    params.set('minPrice', priceRange[0].toString());
    params.set('maxPrice', priceRange[1].toString());
    
    router.push(`/?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Reset subcategory when category changes
    setSelectedSubcategory('all');
  };

  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select onValueChange={handleCategoryChange} value={selectedCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(categories).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
              {selectedCategory && selectedCategory !== 'all' && categories[selectedCategory as keyof typeof categories]?.map(subcat => (
                <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Select onValueChange={setSelectedCondition} value={selectedCondition}>
            <SelectTrigger id="condition">
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Condition</SelectItem>
              {conditions.map(c => (
                 <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Price Range</Label>
            <span className="text-sm text-muted-foreground">Rs {priceRange[0]} - Rs {priceRange[1]}</span>
          </div>
          <Slider
            min={0}
            max={MAX_PRICE}
            step={100}
            value={priceRange}
            onValueChange={setPriceRange}
          />
        </div>
        <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
