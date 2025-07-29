// src/app/dashboard/pending-products/pending-product-filters.tsx
"use client"

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X, Phone, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';

export function PendingProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use state to manage the form inputs before applying them
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    return { from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined };
  });
  const [contactNumber, setContactNumber] = useState(searchParams.get('contactNumber') || '');

  // Effect to update the state if the URL changes (e.g. back button)
  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    setDate({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
    setContactNumber(searchParams.get('contactNumber') || '');
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (date?.from) params.set('from', format(date.from, 'yyyy-MM-dd'));
    else params.delete('from');
    
    if (date?.to) params.set('to', format(date.to, 'yyyy-MM-dd'));
    else params.delete('to');

    if (contactNumber) params.set('contactNumber', contactNumber);
    else params.delete('contactNumber');

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    // Clear state and navigate to the base page
    setDate(undefined);
    setContactNumber('');
    router.push(pathname);
  }
  
  const hasActiveFilters = searchParams.has('from') || searchParams.has('to') || searchParams.has('contactNumber');

  return (
    <Card className="bg-muted/50 mb-8">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Submission Date</Label>
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
          <div className="space-y-2">
             <Label htmlFor="contact-search">Seller Contact</Label>
             <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="contact-search"
                    placeholder="Search by contact..."
                    className="pl-9"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                />
            </div>
          </div>
           <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="w-full">
                <Filter className="mr-2 h-4 w-4"/>
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button onClick={handleResetFilters} variant="ghost" className="w-full">
                    <X className="mr-2 h-4 w-4"/>
                    Reset
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
