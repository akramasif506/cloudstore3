
"use client";

import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import React from 'react';

interface FilterActionsProps {
    onApply: () => void;
    onReset: () => void;
}

// Wrapper to conditionally use SheetClose
const MaybeSheetClose = ({ children }: { children: React.ReactNode }) => {
    // A bit of a hack: Check if a parent element has the sheet's data attribute.
    // This is not foolproof but works for this specific component structure.
    const [isInsideSheet, setIsInsideSheet] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (ref.current && ref.current.closest('[data-state="open"]')) {
            setIsInsideSheet(true);
        }
    }, []);

    if (isInsideSheet) {
        return <SheetClose asChild>{children}</SheetClose>;
    }
    return <>{children}</>;
};


export function FilterActions({ onApply, onReset }: FilterActionsProps) {
    return (
        <div className="flex flex-col gap-2">
            <MaybeSheetClose>
                <Button variant="default" className="w-full" onClick={onApply}>
                    Apply Filters
                </Button>
            </MaybeSheetClose>
            <MaybeSheetClose>
                <Button className="w-full" variant="ghost" onClick={onReset}>
                    Reset Filters
                </Button>
            </MaybeSheetClose>
        </div>
    );
}
