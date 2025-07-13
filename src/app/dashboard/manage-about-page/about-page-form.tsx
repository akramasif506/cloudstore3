
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
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AboutPageContent } from './actions';
import { updateAboutPageContent } from './actions';
import Image from 'next/image';

const aboutPageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  mainContent: z.string().min(20, 'Main content must be at least 20 characters. You can use HTML tags like <p> and <strong> for formatting.'),
  imageUrl: z.any(),
});

type AboutPageFormValues = z.infer<typeof aboutPageSchema>;

interface AboutPageFormProps {
    currentContent: AboutPageContent | null;
}

const defaultContent = {
    title: "About CloudStore",
    description: "Giving pre-loved items a new story.",
    mainContent: `<p>Welcome to CloudStore, your trusted online marketplace for secondhand treasures. We believe that every item has a story and deserves a second chance. Our mission is to create a sustainable and friendly community where people can buy and sell quality pre-owned goods, reducing waste and promoting a more circular economy.</p><p>Founded on the principles of trust, quality, and sustainability, CloudStore provides a seamless and secure platform for you to declutter your life, find unique items, and connect with like-minded individuals. Whether you're searching for vintage furniture, unique home decor, or timeless fashion, you'll find it here.</p>`,
    imageUrl: "https://placehold.co/1200x400.png"
};

export function AboutPageForm({ currentContent }: AboutPageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const contentToEdit = currentContent || defaultContent;

  const form = useForm<AboutPageFormValues>({
    resolver: zodResolver(aboutPageSchema),
    defaultValues: {
      title: contentToEdit.title,
      description: contentToEdit.description,
      mainContent: contentToEdit.mainContent,
      imageUrl: undefined,
    },
  });

  const imageFileRef = form.register("imageUrl");

  async function onSubmit(values: AboutPageFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('mainContent', values.mainContent);
    if (values.imageUrl && values.imageUrl[0]) {
        formData.append('imageUrl', values.imageUrl[0]);
    }

    const result = await updateAboutPageContent(contentToEdit.imageUrl, formData);
    
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Content Updated!",
        description: result.message,
      });
      // Optionally reload or update state if image has changed
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
          Edit the fields below to update the public "About Us" page. Changes will be live immediately after saving.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Title</FormLabel>
                <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Subtitle / Tagline</FormLabel>
                <FormControl><Input {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero Image</FormLabel>
                 <div className="relative w-full aspect-video rounded-md overflow-hidden border mb-2">
                    <Image src={contentToEdit.imageUrl} alt="Current hero image" fill className="object-cover" />
                </div>
                <FormControl>
                  <Input type="file" accept="image/*" {...imageFileRef} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>Upload a new image to replace the current one. Leave empty to keep the existing image.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mainContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Main Content</FormLabel>
                <FormControl><Textarea rows={10} {...field} disabled={isSubmitting} /></FormControl>
                <FormDescription>You can use basic HTML tags like &lt;p&gt;, &lt;strong&gt;, and &lt;em&gt; for formatting.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
