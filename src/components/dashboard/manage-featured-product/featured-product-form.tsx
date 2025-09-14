// src/app/dashboard/manage-featured-product/featured-product-form.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { setFeaturedProduct, clearFeaturedProduct } from '@/app/dashboard/manage-featured-product/actions';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Product } from '@/lib/types';
import type { FeaturedProductInfo } from '@/app/dashboard/manage-featured-product/actions';

const featuredProductSchema = z.object({
  productId: z.string().min(1, 'Please select a product.'),
  promoText: z.string().min(3, 'Promo text must be at least 3 characters.').max(20, 'Promo text must be 20 characters or less.'),
});

interface FeaturedProductFormProps {
    allProducts: Product[];
    currentFeaturedProduct: FeaturedProductInfo | null;
}

export function FeaturedProductForm({ allProducts, currentFeaturedProduct }: FeaturedProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof featuredProductSchema>>({
    resolver: zodResolver(featuredProductSchema),
    defaultValues: {
      productId: currentFeaturedProduct?.productId || '',
      promoText: currentFeaturedProduct?.promoText || '',
    },
  });

  async function onSubmit(values: z.infer<typeof featuredProductSchema>) {
    setIsSubmitting(true);
    const result = await setFeaturedProduct(values);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Featured Product Set!",
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

  async function handleClear() {
    setIsSubmitting(true);
    const result = await clearFeaturedProduct();
    setIsSubmitting(false);

    if (result.success) {
      form.reset({ productId: '', promoText: '' });
      toast({
        title: "Featured Product Cleared!",
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
          Select a product and add promotional text to display a banner on the home page.
        </AlertDescription>
      </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Product to Feature</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                    {allProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <FormField
          control={form.control}
          name="promoText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promotional Tag</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Hot Deal!, 20% Off" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>This text will appear on the featured banner.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Featured Product
          </Button>
          {currentFeaturedProduct && (
             <Button type="button" variant="destructive" onClick={handleClear} disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear Featured Product
            </Button>
          )}
        </div>
      </form>
    </Form>
    </>
  );
}
