
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React from 'react';
import type { Order } from "@/lib/types";

interface OrderPrintButtonProps {
    order: Order;
}

export function OrderPrintButton({ order }: OrderPrintButtonProps) {
    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `CloudStore_Invoice_${order.id}`;
        window.print();
        
        // Use setTimeout to allow the print dialog to open before resetting the title
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    return (
        <Button variant="outline" onClick={handlePrint} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Invoice
        </Button>
    );
}
