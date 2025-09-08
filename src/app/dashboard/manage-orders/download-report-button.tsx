
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useState, useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generateOrderSummaryPdf } from "@/lib/pdf-generator";
import type { Order } from "@/lib/types";

interface DownloadReportButtonProps {
    allOrders: Order[];
}

export function DownloadReportButton({ allOrders }: DownloadReportButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleDownload = () => {
        startTransition(async () => {
            const ordersToReport = allOrders.filter(o => selectedIds.has(o.internalId!));
            
            if (ordersToReport.length === 0) {
                toast({
                    variant: "destructive",
                    title: "No Orders Selected",
                    description: "Please select at least one order using the checkboxes to generate a report."
                });
                return;
            }

            try {
                // Assuming we want a title for the report, we'll find min/max dates from selected orders
                const dates = ordersToReport.map(o => new Date(o.createdAt).getTime());
                const from = new Date(Math.min(...dates)).toISOString().split('T')[0];
                const to = new Date(Math.max(...dates)).toISOString().split('T')[0];
                
                await generateOrderSummaryPdf(ordersToReport, { from, to });
                
                toast({
                    title: "Report Generated",
                    description: `Your PDF summary for ${ordersToReport.length} order(s) is being downloaded.`
                });

            } catch (error) {
                console.error("Failed to generate order report:", error);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                 toast({
                    variant: "destructive",
                    title: "Report Failed",
                    description: `Could not generate the report. ${errorMessage}`
                });
            }
        });
    };

    return (
        <Button onClick={handleDownload} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download Report
        </Button>
    );
}
