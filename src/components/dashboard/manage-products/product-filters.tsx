"use client"

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Filter, Search, X } from "lucide-react";
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';


interface ProductFiltersProps {
  categories: CategoryMap;
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [date, setDate] = useState<DateRange | undefined>({
      from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
  });

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedSubcategory(searchParams.get('subcategory') || 'all');
    setDate({
        from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
        to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    });
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) params.set('q', searchQuery); else params.delete('q');
    if (selectedCategory !== 'all') params.set('category', selectedCategory); else params.delete('category');
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory); else params.delete('subcategory');
    if (date?.from) params.set('from', format(date.from, 'yyyy-MM-dd')); else params.delete('from');
    if (date?.to) params.set('to', format(date.to, 'yyyy-MM-dd')); else params.delete('to');
    
    router.push(`/dashboard/manage-products?${params.toString()}`);
  };
  
  const handleResetFilters = () => {
    router.push('/dashboard/manage-products');
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory('all');
  };

  const enabledCategories = Object.entries(categories).filter(([_, catData]) => catData.enabled);

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search Name/ID</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search"
                    placeholder="Search..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategory}>
              <SelectTrigger id="category"><SelectValue placeholder="All" /></SelectTrigger>
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
              onValueChange={setSelectedSubcategory} 
              value={selectedSubcategory}
              disabled={selectedCategory === 'all'}
            >
              <SelectTrigger id="subcategory"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {selectedCategory !== 'all' && categories[selectedCategory as keyof typeof categories]?.subcategories
                  .filter(sub => sub.enabled)
                  .map(subcat => (
                    <SelectItem key={subcat.name} value={subcat.name}>{subcat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label>Created Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 lg:col-start-4">
              <Button onClick={handleApplyFilters} className="w-full"><Filter className="mr-2 h-4 w-4"/>Apply</Button>
              <Button onClick={handleResetFilters} variant="ghost" className="w-full"><X className="mr-2 h-4 w-4"/>Reset</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
