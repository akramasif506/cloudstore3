
// src/app/dashboard/broadcast-message/broadcast-form.tsx
"use client";

import { useState, useEffect } from 'react';
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
import type { CategoryMap } from '../manage-categories/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const broadcastSchema = z.object({
  message: z.string().min(3, 'Message must be at least 3 characters.'),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

interface BroadcastFormProps {
    currentMessage: { id: number; message: string; link: string | null; } | null;
    categories: CategoryMap;
}

export function BroadcastForm({ currentMessage: initialMessage, categories }: BroadcastFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      message: currentMessage?.message || '',
      link: currentMessage?.link || '',
    },
  });

  useEffect(() => {
    if (!selectedCategory) {
      form.setValue('link', '');
      return;
    }
    
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('category', selectedCategory);

    if (selectedSubcategory) {
        params.set('subcategory', selectedSubcategory);
    }
    
    form.setValue('link', `${baseUrl}/?${params.toString()}`);

  }, [selectedCategory, selectedSubcategory, form]);

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
      setSelectedCategory('');
      setSelectedSubcategory('');
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
  
  const enabledCategories = Object.entries(categories).filter(([_, catData]) => catData.enabled);

  return (
    <>
      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Setting a message here will display a banner at the top of every page for all users. You can optionally link it to a category.
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
        
        <Separator />
        
        <div>
            <h3 className="text-lg font-medium">Link to Category (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">Automatically generate a link to a category page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(value) => { setSelectedCategory(value); setSelectedSubcategory(''); }} value={selectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {enabledCategories.map(([catName]) => (
                                <SelectItem key={catName} value={catName}>{catName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Subcategory</Label>
                    <Select onValueChange={setSelectedSubcategory} value={selectedSubcategory} disabled={!selectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Subcategories</SelectItem>
                            {selectedCategory && categories[selectedCategory as keyof typeof categories]?.subcategories
                                .filter(sub => sub.enabled)
                                .map(subcat => (
                                <SelectItem key={subcat.name} value={subcat.name}>{subcat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Generated Link</FormLabel>
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
