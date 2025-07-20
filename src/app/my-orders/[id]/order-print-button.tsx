
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React from 'react';

interface OrderPrintButtonProps {
    orderId: string;
}

export function OrderPrintButton({ orderId }: OrderPrintButtonProps) {
    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `CloudStore_Invoice_${orderId}`;
        window.print();
        
        // Use setTimeout to allow the print dialog to open before resetting the title
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    return (
        <Button variant="outline" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
        </Button>
    );
}
