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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { setReturnPolicy } from '@/app/dashboard/manage-returns/actions';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ReturnPolicy } from '@/app/dashboard/manage-returns/actions';

const policySchema = z.object({
  isEnabled: z.boolean(),
  returnWindowDays: z.coerce.number().min(0, 'Return window must be 0 or more days.'),
  policyText: z.string().min(10, 'Policy text must be at least 10 characters.'),
});

interface ReturnPolicyFormProps {
    currentPolicy: ReturnPolicy;
}

export function ReturnPolicyForm({ currentPolicy }: ReturnPolicyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof policySchema>>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      isEnabled: currentPolicy.isEnabled,
      returnWindowDays: currentPolicy.returnWindowDays,
      policyText: currentPolicy.policyText,
    },
  });

  async function onSubmit(values: z.infer<typeof policySchema>) {
    setIsSubmitting(true);
    const result = await setReturnPolicy(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Policy Updated!",
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
          Enable returns and set the conditions here. If enabled, customers will see a "Request Return" button on their delivered orders within the specified time window.
        </AlertDescription>
      </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Product Returns</FormLabel>
                <FormDescription>
                  Allow customers to request returns for eligible orders.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="returnWindowDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Window (in days)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 7" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>How many days after delivery a customer has to request a return. Set to 0 to disable time limit.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="policyText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Policy Details</FormLabel>
              <FormControl>
                <Textarea rows={8} {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>This text will be shown to customers when they initiate a return. Explain the process and conditions.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Policy
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}
