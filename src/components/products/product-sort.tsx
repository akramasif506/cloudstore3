
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '../ui/label';

export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('sortBy', value);
    } else {
      params.delete('sortBy');
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-end gap-2 w-full">
        <Label htmlFor="sort-by" className="text-sm shrink-0">Sort by</Label>
        <Select
            onValueChange={handleSortChange}
            defaultValue={searchParams.get('sortBy') || 'newest'}
        >
            <SelectTrigger id="sort-by" className="w-full">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
        </Select>
    </div>
  );
}
