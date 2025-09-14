
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // This effect synchronizes the input field if the URL changes (e.g., back button)
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // This effect will run when the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update the URL if the query in the input differs from the URL's query
      if (searchQuery !== (searchParams.get('q') || '')) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) {
          params.set('q', searchQuery);
        } else {
          // If the search query is empty, remove the 'q' param
          params.delete('q');
        }
        // Pushing the new URL will trigger a re-render
        router.push(`/?${params.toString()}`);
      }
    }, 500); // 500ms delay after user stops typing

    // Cleanup function to clear the timeout if the user types again
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, router]);


  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search for items..."
        className="pl-9 w-full"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
