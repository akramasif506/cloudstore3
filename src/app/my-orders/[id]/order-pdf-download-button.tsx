
"use client";

import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { Download } from "lucide-react";

interface OrderPdfDownloadButtonProps {
    order: Order;
}

export function OrderPdfDownloadButton({ order }: OrderPdfDownloadButtonProps) {
    const handleDownload = () => {
        const originalTitle = document.title;
        document.title = `CloudStore_Invoice_${order.id}`;

        // Use the browser's native print functionality
        window.print();

        // Restore the original title shortly after the print dialog opens.
        // This is more reliable than 'afterprint' which may not fire if the user cancels.
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    return (
        <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
        </Button>
    );
}
