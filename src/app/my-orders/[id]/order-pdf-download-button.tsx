
"use client";

import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
import { Download } from "lucide-react";
import { generateCustomerInvoicePdf } from "@/lib/pdf-generator";

interface OrderPdfDownloadButtonProps {
    order: Order;
}

export function OrderPdfDownloadButton({ order }: OrderPdfDownloadButtonProps) {
    const handleDownload = async () => {
        await generateCustomerInvoicePdf(order);
    };

    return (
        <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
        </Button>
    );
}
