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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from './actions';
import { Loader2 } from 'lucide-react';

const notificationSchema = z.object({
  target: z.enum(['all', 'specific'], {
    required_error: "You need to select a target audience.",
  }),
  userId: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  body: z.string().min(10, 'Body must be at least 10 characters.'),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
}).refine(data => data.target === 'all' || (data.target === 'specific' && data.userId), {
  message: "User ID is required for specific targeting.",
  path: ["userId"],
});

export function NotificationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      target: 'all',
      userId: '',
      title: '',
      body: '',
      link: '',
    },
  });

  const target = form.watch('target');

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
        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                  disabled={isSubmitting}
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="all" /></FormControl>
                    <FormLabel className="font-normal">All Users</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value="specific" /></FormControl>
                    <FormLabel className="font-normal">Specific User</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {target === 'specific' && (
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the user's ID" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>You can find the User ID in your database.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
