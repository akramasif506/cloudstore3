
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
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PromoBanner } from './actions';
import { updatePromoBanner, clearPromoBanner } from './actions';
import Image from 'next/image';

const promoBannerSchema = z.object({
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  image: z.any(),
});

type PromoBannerFormValues = z.infer<typeof promoBannerSchema>;

interface PromoBannerFormProps {
    currentBanner: PromoBanner | null;
}

export function PromoBannerForm({ currentBanner }: PromoBannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentBanner?.imageUrl || null);
  const { toast } = useToast();

  const form = useForm<PromoBannerFormValues>({
    resolver: zodResolver(promoBannerSchema),
    defaultValues: {
      link: currentBanner?.link || '',
      image: undefined,
    },
  });

  const imageFileRef = form.register("image");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: PromoBannerFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('link', values.link || '');
    if (values.image && values.image[0]) {
        formData.append('image', values.image[0]);
    }

    const result = await updatePromoBanner(currentBanner?.imageUrl || null, formData);
    
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Banner Updated!",
        description: result.message,
      });
      // The page will be revalidated by the server action
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message,
      });
    }
  }

  async function handleClear() {
    setIsSubmitting(true);
    const result = await clearPromoBanner();
    setIsSubmitting(false);

    if (result.success) {
      form.reset({ link: '', image: undefined });
      setImagePreview(null);
      toast({
        title: "Banner Cleared!",
        description: result.message,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Clear Failed",
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
          Upload a banner image to be displayed on the homepage. You can also provide an optional link for the banner to redirect to.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Image</FormLabel>
                {imagePreview && (
                 <div className="relative w-full aspect-video rounded-md overflow-hidden border mb-2">
                    <Image src={imagePreview} alt="Current hero image" fill className="object-cover" />
                </div>
                )}
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    {...imageFileRef} 
                    disabled={isSubmitting}
                    onChange={(e) => {
                      field.onChange(e.target.files);
                      handleImageChange(e);
                    }}
                  />
                </FormControl>
                <FormDescription>Recommended aspect ratio: 16:9 or similar wide format.</FormDescription>
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
                  <Input placeholder="e.g., https://your-site.com/sale" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>If provided, the banner will be a clickable link to this URL.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentBanner ? 'Update Banner' : 'Set Banner'}
            </Button>
             {currentBanner && (
             <Button type="button" variant="destructive" onClick={handleClear} disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear Banner
            </Button>
          )}
          </div>
        </form>
      </Form>
    </>
  );
}
