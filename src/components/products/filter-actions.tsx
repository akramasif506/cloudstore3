
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
        <div className="hidden lg:flex w-full flex-col gap-2">
            <Button variant="default" className="w-full" onClick={onApply}>
                Apply Filters
            </Button>
            <Button className="w-full" variant="ghost" onClick={onReset}>
                Reset Filters
            </Button>
        </div>
    );
}
