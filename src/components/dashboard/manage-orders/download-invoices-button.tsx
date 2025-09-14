"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/lib/types";
import { useRouter } from "next/navigation";

interface DownloadInvoicesButtonProps {
    selectedOrders: Order[];
}

export function DownloadInvoicesButton({ selectedOrders }: DownloadInvoicesButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleDownload = () => {
        if (selectedOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Orders Selected",
                description: "Please select orders using the checkboxes to download invoices."
            });
            return;
        }

        startTransition(() => {
            const orderIds = selectedOrders.map(o => o.internalId);
            // The route now points to the page inside the (print) route group
            const url = `/dashboard/manage-orders/print?orders=${orderIds.join(',')}`;
            // Open the printable page in a new tab
            window.open(url, '_blank');
        });
    };

    return (
        <Button onClick={handleDownload} disabled={isPending || selectedOrders.length === 0}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download Invoices
        </Button>
    );
}
