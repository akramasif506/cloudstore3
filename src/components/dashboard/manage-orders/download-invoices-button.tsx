
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2, Printer } from "lucide-react";
import React, { useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";

interface DownloadInvoicesButtonProps {
    selectedOrders: Order[];
}

export function DownloadInvoicesButton({ selectedOrders }: DownloadInvoicesButtonProps) {
    const { toast } = useToast();

    const handlePrint = () => {
        if (selectedOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Orders Selected",
                description: "Please select orders using the checkboxes to print invoices."
            });
            return;
        }

        const orderIds = selectedOrders.map(o => o.internalId).join(',');
        const printUrl = `/dashboard/manage-orders/print?orders=${orderIds}`;
        window.open(printUrl, '_blank');
    };

    return (
        <Button onClick={handlePrint} disabled={selectedOrders.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoices
        </Button>
    );
}
