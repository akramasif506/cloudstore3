
"use client";

import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";

interface FilterActionsProps {
    onApply: () => void;
    onReset: () => void;
}

export function FilterActions({ onApply, onReset }: FilterActionsProps) {
    // This component is used in two places:
    // 1. Inside the Sheet for mobile, where SheetClose is needed.
    // 2. On the desktop sidebar, where SheetClose does nothing.
    return (
        <div className="flex flex-col gap-2">
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
