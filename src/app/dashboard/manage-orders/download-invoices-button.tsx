
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generateInvoicesPdf } from "@/lib/pdf-generator";
import type { Order } from "@/lib/types";

interface DownloadInvoicesButtonProps {
    selectedOrders: Order[];
}

export function DownloadInvoicesButton({ selectedOrders }: DownloadInvoicesButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDownload = () => {
        if (selectedOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Orders Selected",
                description: "Please select orders using the checkboxes to download invoices."
            });
            return;
        }

        startTransition(async () => {
            try {
                await generateInvoicesPdf(selectedOrders);
                
                toast({
                    title: "Invoices Generated",
                    description: `Your PDF with ${selectedOrders.length} invoice(s) is being downloaded.`
                });

            } catch (error) {
                console.error("Failed to generate invoices:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                 toast({
                    variant: "destructive",
                    title: "Generation Failed",
                    description: `Could not generate the PDF. ${errorMessage}`
                });
            }
        });
    };

    return (
        <Button onClick={handleDownload} disabled={isPending || selectedOrders.length === 0}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download Invoices
        </Button>
    );
}
