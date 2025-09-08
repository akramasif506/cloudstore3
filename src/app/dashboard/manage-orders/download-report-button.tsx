
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useState, useTransition } from 'react';
import { useSearchParams } from "next/navigation";
import { getAllOrders } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { generateOrderSummaryPdf } from "@/lib/pdf-generator";

export function DownloadReportButton() {
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const handleDownload = () => {
        startTransition(async () => {
            const from = searchParams.get('from');
            const to = searchParams.get('to');
            const status = searchParams.get('status') as any;
            const q = searchParams.get('q') || undefined;

            if (!from || !to) {
                toast({
                    variant: "destructive",
                    title: "Date Range Required",
                    description: "Please select a 'from' and 'to' date in the filter to generate a report."
                });
                return;
            }

            try {
                const ordersToReport = await getAllOrders({ from, to, status, q });

                if (ordersToReport.length === 0) {
                     toast({
                        title: "No Orders Found",
                        description: "There are no orders matching the selected filters."
                    });
                    return;
                }

                await generateOrderSummaryPdf(ordersToReport, { from, to });
                
                toast({
                    title: "Report Generated",
                    description: "Your order summary PDF is being downloaded."
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
