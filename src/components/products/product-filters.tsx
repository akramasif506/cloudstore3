
"use client";

import { useState } from 'react';
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

export function ProductFilters() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [distance, setDistance] = useState([50]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

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
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(categories).map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedCategory && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select>
              <SelectTrigger id="subcategory">
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                {categories[selectedCategory as keyof typeof categories].map(subcat => (
                  <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Distance</Label>
            <span className="text-sm text-muted-foreground">{distance[0]} km</span>
          </div>
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            value={distance}
            onValueChange={setDistance}
          />
        </div>
        <Button className="w-full bg-accent hover:bg-accent/90">Apply Filters</Button>
      </CardContent>
    </Card>
  );
}
