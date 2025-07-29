// src/app/dashboard/pending-products/pending-product-filters.tsx
"use client"

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export function PendingProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  
  const date: DateRange | undefined = {
    from: fromDate ? new Date(fromDate) : undefined,
    to: toDate ? new Date(toDate) : undefined,
  };
  
  const createQueryString = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    return newParams.toString();
  };
  
  const handleDateChange = (newDate: DateRange | undefined) => {
    router.push(pathname + '?' + createQueryString({ 
        from: newDate?.from ? format(newDate.from, 'yyyy-MM-dd') : null,
        to: newDate?.to ? format(newDate.to, 'yyyy-MM-dd') : null
    }));
  };

  const handleResetFilters = () => {
    router.push(pathname);
  }
  
  const hasActiveFilters = !!(fromDate || toDate);

  return (
    <Card className="bg-muted/50 mb-8">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Submission Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
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
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
          </div>
          {hasActiveFilters && (
            <div className="flex gap-2">
                <Button onClick={handleResetFilters} variant="ghost" className="w-full"><X className="mr-2 h-4 w-4"/>Reset Filters</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
