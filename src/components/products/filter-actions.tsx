
"use client";

import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import React from 'react';

interface FilterActionsProps {
    onApply: () => void;
    onReset: () => void;
}

export function FilterActions({ onApply, onReset }: FilterActionsProps) {
    return (
        <div className="flex w-full flex-col gap-2 lg:hidden">
            <SheetClose asChild>
                <Button variant="default" className="w-full" onClick={onApply}>
                    Apply Filters
                </Button>
            </SheetClose>
            <SheetClose asChild>
                <Button className="w-full" variant="ghost" onClick={onReset}>
                    Reset Filters
                </Button>
            </SheetClose>
        </div>
    );
}
