
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { setFeeConfig } from './actions';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { FeeConfig } from '@/lib/types';

const feeSchema = z.object({
  platformFeePercent: z.coerce.number().min(0, 'Platform fee cannot be negative.').max(100, 'Platform fee cannot exceed 100%.'),
  handlingFeeFixed: z.coerce.number().min(0, 'Handling fee cannot be negative.'),
});

interface FeeFormProps {
    currentFees: FeeConfig | null;
}

export function FeeForm({ currentFees }: FeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof feeSchema>>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      platformFeePercent: currentFees?.platformFeePercent || 0,
      handlingFeeFixed: currentFees?.handlingFeeFixed || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof feeSchema>) {
    setIsSubmitting(true);
    const result = await setFeeConfig(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Fees Updated!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message,
      });
    }
  }

  return (
    <>
      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Set your store-wide fees here. These will be automatically added to every customer's cart at checkout. Set a value to 0 to disable that fee.
        </AlertDescription>
      </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="platformFeePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform Fee (%)</FormLabel>
                   <div className="relative">
                        <Input type="number" placeholder="e.g. 2.5" {...field} disabled={isSubmitting} />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                  <FormDescription>A percentage-based fee calculated on the order subtotal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="handlingFeeFixed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handling Fee (Fixed)</FormLabel>
                  <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">Rs</span>
                        </div>
                        <Input type="number" placeholder="e.g. 50.00" className="pl-8" {...field} disabled={isSubmitting} />
                    </div>
                  <FormDescription>A fixed-amount fee added to every order.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Fee Configuration
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}
