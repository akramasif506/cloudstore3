
"use client";

import { useState, useEffect } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from 'lucide-react';
import { suggestListingDetails } from '@/ai/flows/suggest-listing-details';
import { useToast } from "@/hooks/use-toast";
import { createListing } from './actions';
import { listingSchema } from '@/lib/schemas';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Frown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

const isBrowser = typeof window !== 'undefined';

// Client schema handles the FileList for the image.
const clientListingSchema = listingSchema.extend({
  productImage: isBrowser
    ? z.instanceof(FileList).refine((files) => files?.length === 1, 'Product image is required.')
    : z.any(),
});


type ClientListingSchema = z.infer<typeof clientListingSchema>;


const categories = {
  'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
  'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
  'Cloths': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
  'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  'Outdoor & Sports': ['Bikes', 'Camping Gear', 'Fitness'],
  'Grocery': ['Snacks', 'Beverages', 'Pantry Staples'],
  'Other': ['Miscellaneous'],
};

export function ListingForm() {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const form = useForm<ClientListingSchema>({
    resolver: zodResolver(clientListingSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      price: undefined,
      category: '',
      subcategory: '',
      productImage: undefined,
    },
  });

  const isLoading = isSuggesting || isSubmitting;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="flex flex-col items-center justify-center text-center py-20">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
            <Frown className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>You're Not Logged In</CardTitle>
          <CardDescription>Please log in to list a new product.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login?redirect=/listings/new">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSuggestDetails = async () => {
    const { productName, productDescription, category, subcategory, productImage } = form.getValues();
    const imageFile = productImage?.[0];

    if (!imageFile || !category || !subcategory) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a category, subcategory, and an image before using the AI assistant.",
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const imageDataUrl = await fileToBase64(imageFile);
      const result = await suggestListingDetails({
        productName: productName || "Item",
        productDescription: productDescription || "A secondhand item.",
        category,
        subcategory,
        productImage: imageDataUrl,
      });

      if (result.suggestedTitle) {
        form.setValue('productName', result.suggestedTitle, { shouldValidate: true });
      }
      if (result.suggestedDescription) {
        form.setValue('productDescription', result.suggestedDescription, { shouldValidate: true });
      }
      toast({
        title: "Suggestions applied!",
        description: "The AI has updated your title and description.",
      });
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({
        variant: "destructive",
        title: "AI Assistant Error",
        description: "Could not generate suggestions. Please try again.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  async function onSubmit(values: ClientListingSchema) {
    setIsSubmitting(true);

    const formData = new FormData();
    for (const key in values) {
      if (key === 'productImage') {
        if (values.productImage && values.productImage.length > 0) {
          formData.append(key, values.productImage[0]);
        }
      } else {
        const value = (values as any)[key];
        if (value !== undefined) {
          formData.append(String(key), String(value));
        }
      }
    }

    const result = await createListing(formData);

    if (result?.success === false) {
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: result.message,
      });

      if (result.errors) {
        for (const [field, messages] of Object.entries(result.errors)) {
          if (messages) {
            form.setError(field as FieldPath<ClientListingSchema>, {
              type: 'server',
              message: messages[0],
            });
          }
        }
      }
    }
    
    setIsSubmitting(false);
  };
  
  const selectedCategory = form.watch('category');
  const productImageRef = form.register("productImage");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="productImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" {...productImageRef} disabled={isLoading} />
              </FormControl>
              <FormDescription>Upload a clear photo of your item.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('subcategory', '');
                  }}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(categories).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory || isLoading}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedCategory && categories[selectedCategory as keyof typeof categories]?.map(subcat => (
                      <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSuggestDetails}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isSuggesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Suggest with AI
          </Button>
          <p className="text-sm text-muted-foreground">Let AI write your title and description based on your image and category.</p>
        </div>

        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vintage Leather Armchair" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your item in detail..." rows={6} {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">Rs</span>
                </div>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-8"
                    step="0.01"
                    disabled={isLoading}
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    value={field.value ?? ''}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? 'Submitting for Review...' : 'Submit for Review'}
        </Button>
      </form>
    </Form>
  );
}
