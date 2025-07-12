"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

const listingSchema = z.object({
  productName: z.string().min(3, 'Title must be at least 3 characters long.'),
  productDescription: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.string().nonempty('Please select a category.'),
  subcategory: z.string().nonempty('Please select a subcategory.'),
  productImage: z.any()
    .refine((files) => files?.length === 1, 'Product image is required.')
});

const categories = {
  'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
  'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
  'Apparel': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
  'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  'Outdoor & Sports': ['Bikes', 'Camping Gear', 'Fitness'],
};

export function ListingForm() {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      price: 0,
      category: '',
      subcategory: '',
    },
  });
  
  const selectedCategory = form.watch('category');

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
        description: "Please provide a category, subcategory, and image before using the AI assistant.",
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

  function onSubmit(values: z.infer<typeof listingSchema>) {
    console.log(values);
    toast({
      title: "Listing Created!",
      description: "Your item is now available for others to see.",
    });
  }

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
                <Input type="file" accept="image/*" {...form.register("productImage")} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCategory}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedCategory && categories[selectedCategory as keyof typeof categories].map(subcat => (
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
            disabled={isSuggesting}
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
                <Input placeholder="e.g. Vintage Leather Armchair" {...field} />
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
                <Textarea placeholder="Describe your item in detail..." rows={6} {...field} />
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
                        <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <FormControl>
                        <Input type="number" placeholder="0.00" className="pl-7" {...field} />
                    </FormControl>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full md:w-auto">Create Listing</Button>
      </form>
    </Form>
  );
}
