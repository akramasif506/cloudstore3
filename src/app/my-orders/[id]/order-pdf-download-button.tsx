
"use client";

import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { Download } from "lucide-react";

interface OrderPdfDownloadButtonProps {
    order: Order;
}

export function OrderPdfDownloadButton({ order }: OrderPdfDownloadButtonProps) {
    const handleDownload = () => {
        // Use the browser's native print functionality
        window.print();
    };

    return (
        <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
        </Button>
    );
}
