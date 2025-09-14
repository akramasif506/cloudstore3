
"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetFooter, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { ProductFilters } from './product-filters';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import type { ProductConditionMap } from '@/app/dashboard/manage-product-conditions/actions';

interface MobileFilterSheetProps {
    categories: CategoryMap;
    conditions: ProductConditionMap;
}

export function MobileFilterSheet({ categories, conditions }: MobileFilterSheetProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col p-0">
                <SheetHeader className="p-6 pb-0">
                  <SheetTitle>Filter Products</SheetTitle>
                  <SheetDescription>
                    Refine your search using the options below.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6 flex-1 overflow-y-auto">
                    <ProductFilters 
                        categories={categories} 
                        conditions={conditions} 
                        onApply={() => setIsOpen(false)}
                        onReset={() => setIsOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
