
"use client"

import { useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import type { Order } from '@/lib/types';

const statusOptions: Order['status'][] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const searchQuery = searchParams.get('q') || '';
  const selectedStatus = searchParams.get('status') || 'all';
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  
  const date: DateRange | undefined = {
    from: fromDate ? new Date(fromDate) : undefined,
    to: toDate ? new Date(toDate) : undefined,
  };
  
  const createQueryString = (params: Record<string, string | number | undefined | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || String(value).length === 0) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    }
    return newParams.toString();
  };
  
  const handleFilterChange = (key: string, value: string | DateRange | undefined | null) => {
    startTransition(() => {
        if (key === 'date') {
            const dateRange = value as DateRange | undefined;
            router.push(pathname + '?' + createQueryString({ 
                from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null
            }));
        } else {
            router.push(pathname + '?' + createQueryString({ [key]: value === 'all' ? null : value }));
        }
    });
  };

  const handleResetFilters = () => {
    startTransition(() => {
        router.push(pathname);
    });
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="search">Search Order ID</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search"
                    placeholder="Search by ID..."
                    className="pl-9"
                    defaultValue={searchQuery}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleFilterChange('q', e.currentTarget.value)
                        }
                    }}
                    disabled={isPending}
                />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={(value) => handleFilterChange('status', value)} value={selectedStatus} disabled={isPending}>
              <SelectTrigger id="status"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
                        disabled={isPending}
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
                        onSelect={(newDate) => handleFilterChange('date', newDate)}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 lg:col-start-4">
              <Button onClick={handleResetFilters} variant="ghost" className="w-full" disabled={isPending}><X className="mr-2 h-4 w-4"/>Reset All Filters</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
