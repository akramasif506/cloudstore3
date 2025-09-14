
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
import type { Product } from '@/lib/types';


interface ProductFiltersProps {
  categories: CategoryMap;
}

const statusOptions: Product['status'][] = ['active', 'sold', 'pending_review', 'rejected', 'pending_image'];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category') || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
  const [selectedStock, setSelectedStock] = useState(searchParams.get('stock') || 'all');
  const [date, setDate] = useState<DateRange | undefined>({
      from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
  });

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setSelectedCategoryId(searchParams.get('category') || 'all');
    setSelectedSubcategory(searchParams.get('subcategory') || 'all');
    setSelectedStatus(searchParams.get('status') || 'all');
    setSelectedStock(searchParams.get('stock') || 'all');
    setDate({
        from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
        to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
    });
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategoryId !== 'all') params.set('category', selectedCategoryId);
    if (selectedSubcategory !== 'all') params.set('subcategory', selectedSubcategory);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedStock !== 'all') params.set('stock', selectedStock);
    if (date?.from) params.set('from', format(date.from, 'yyyy-MM-dd'));
    if (date?.to) params.set('to', format(date.to, 'yyyy-MM-dd'));
    
    params.set('page', '1'); // Reset to first page on new filter
    router.push(`/dashboard/manage-products?${params.toString()}`);
  };
  
  const handleResetFilters = () => {
    router.push('/dashboard/manage-products');
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setSelectedSubcategory('all');
  };

  const enabledCategories = Object.values(categories).filter(cat => cat.enabled);

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
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
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={setSelectedStatus} value={selectedStatus}>
              <SelectTrigger id="status"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Select onValueChange={setSelectedStock} value={selectedStock}>
              <SelectTrigger id="stock"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
              <SelectTrigger id="category"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {enabledCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select 
              onValueChange={setSelectedSubcategory} 
              value={selectedSubcategory}
              disabled={selectedCategoryId === 'all'}
            >
              <SelectTrigger id="subcategory"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {selectedCategoryId !== 'all' && categories[selectedCategoryId]?.subcategories
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
          <div className="flex gap-2 xl:col-span-full">
              <Button onClick={handleApplyFilters} className="w-full"><Filter className="mr-2 h-4 w-4"/>Apply Filters</Button>
              <Button onClick={handleResetFilters} variant="ghost" className="w-full"><X className="mr-2 h-4 w-4"/>Reset All</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
