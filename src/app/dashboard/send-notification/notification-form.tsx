// src/app/dashboard/send-notification/notification-form.tsx
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
import { sendNotification } from './actions';
import { Loader2 } from 'lucide-react';

const notificationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  body: z.string().min(10, 'Body must be at least 10 characters.'),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export function NotificationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      body: '',
      link: '',
    },
  });

  async function onSubmit(values: z.infer<typeof notificationSchema>) {
    setIsSubmitting(true);
    const result = await sendNotification(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Notification Sent!",
        description: result.message,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Send Notification",
        description: result.message,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <p className="text-sm text-muted-foreground">
          This form will send a push notification to all users who have granted permission.
        </p>
        
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Flash Sale!" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Body</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Get 50% off on all furniture for the next 24 hours."
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
                <Input placeholder="https://yourapp.com/listings/some-product" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>When the user clicks the notification, they will be taken to this URL.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Notification
        </Button>
      </form>
    </Form>
  );
}
