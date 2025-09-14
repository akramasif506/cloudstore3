
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generateSellerOrderPdfs } from "@/lib/pdf-generator";
import type { Order } from "@/lib/types";
import { getOrderWithSellerDetails } from "@/app/dashboard/manage-orders/actions";

interface DownloadFulfillmentButtonProps {
    selectedOrders: Order[];
}

export function DownloadFulfillmentButton({ selectedOrders }: DownloadFulfillmentButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDownload = () => {
        if (selectedOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Orders Selected",
                description: "Please select orders using the checkboxes to download fulfillment slips."
            });
            return;
        }

        startTransition(async () => {
            try {
                // We need to fetch the full seller details for each selected order
                const detailedOrdersPromises = selectedOrders.map(order => getOrderWithSellerDetails(order));
                const detailedOrders = await Promise.all(detailedOrdersPromises);
                
                await generateSellerOrderPdfs(detailedOrders);
                
                toast({
                    title: "Fulfillment Slips Generated",
                    description: `Your PDF slips are being downloaded.`
                });

            } catch (error) {
                console.error("Failed to generate fulfillment slips:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                 toast({
                    variant: "destructive",
                    title: "Generation Failed",
                    description: `Could not generate the fulfillment slips. ${errorMessage}`
                });
            }
        });
    };

    return (
        <Button onClick={handleDownload} disabled={isPending || selectedOrders.length === 0} variant="outline">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Fulfillment Slips
        </Button>
    );
}
