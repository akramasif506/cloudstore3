
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function ListingForm() {
  return (
    <Card className="border-dashed">
        <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <Wrench className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Under Maintenance</CardTitle>
            <CardDescription>
                This form is temporarily disabled for debugging. Please use the <a href="/test-form" className="underline text-primary font-semibold">Test Form</a> page to investigate the form issue.
            </CardDescription>
        </CardHeader>
        <CardContent></CardContent>
    </Card>
  );
}
