
// src/app/dashboard/broadcast-message/broadcast-form.tsx
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
import { useToast } from '@/hooks/use-toast';
import { setBroadcastMessage, clearBroadcastMessage } from './actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const broadcastSchema = z.object({
  message: z.string().min(3, 'Message must be at least 3 characters.'),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

interface BroadcastFormProps {
    currentMessage: { id: number; message: string; link: string | null; } | null
}

export function BroadcastForm({ currentMessage: initialMessage }: BroadcastFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: currentMessage?.message || '',
      link: currentMessage?.link || '',
    },
  });

  async function onSubmit(values: z.infer<typeof broadcastSchema>) {
    setIsSubmitting(true);
    const result = await setBroadcastMessage(values);
    if (result.success) {
      // Manually create a new object for state update
      const newBroadcastData = {
          id: new Date().getTime(),
          message: values.message,
          link: values.link || null
      };
      setCurrentMessage(newBroadcastData);
      toast({
        title: "Broadcast Set!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Set Broadcast",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  }

  async function handleClear() {
    setIsSubmitting(true);
    const result = await clearBroadcastMessage();
    setIsSubmitting(false);

    if (result.success) {
      form.reset({ message: '', link: '' });
      setCurrentMessage(null);
      toast({
        title: "Broadcast Cleared!",
        description: result.message,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Failed to Clear Broadcast",
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
          Setting a message here will display a banner at the top of every page for all users. Clearing the message will remove the banner.
        </AlertDescription>
      </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broadcast Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. 🎉 We're having a flash sale! Get 20% off all electronics this weekend."
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://yourapp.com/electronics" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>If provided, the banner will be a clickable link to this URL.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentMessage ? 'Update Broadcast' : 'Set Broadcast'}
          </Button>
          {currentMessage && (
             <Button type="button" variant="destructive" onClick={handleClear} disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear Broadcast
            </Button>
          )}
        </div>
      </form>
    </Form>
    </>
  );
}
