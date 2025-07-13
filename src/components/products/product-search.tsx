
"use client";

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set('q', searchQuery);
      } else {
        params.delete('q');
      }
      router.push(`/?${params.toString()}`);
    }
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for items..."
        className="pl-9 w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
      />
    </div>
  );
}
