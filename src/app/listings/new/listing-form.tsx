
"use client";

import { useState } from 'react';
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
import { Loader2, Sparkles, Frown, LogIn, Wand2, RefreshCw } from 'lucide-react';
import { extractListingDetails } from '@/ai/flows/extract-listing-details';
import { useToast } from "@/hooks/use-toast";
import { listingSchema } from '@/lib/schemas';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createListing } from './actions';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';


const isBrowser = typeof window !== 'undefined';

const clientListingSchema = listingSchema.extend({
  productImage: isBrowser
    ? z.instanceof(FileList).refine((files) => files?.length === 1, 'Product image is required.')
    : z.any(),
  initialDescription: z.string().min(10, "Please describe your item in a bit more detail."),
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

const conditions = ['New', 'Like New', 'Used'];

export function ListingForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const form = useForm<ClientListingSchema>({
    resolver: zodResolver(clientListingSchema),
    mode: "onBlur",
    defaultValues: {
      initialDescription: '',
      productName: '',
      productDescription: '',
      price: null,
      category: '',
      subcategory: '',
      condition: undefined,
      productImage: undefined,
    },
  });
  
  const isFormProcessing = isGenerating || isSubmitting;
  const productImageRef = form.register('productImage');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const getCompressedImage = async (): Promise<File | null> => {
      const imageFileList = form.getValues('productImage');
      if (!imageFileList || imageFileList.length === 0) {
          form.trigger('productImage');
          return null;
      }
      const file = imageFileList[0];
      const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
      };
      try {
          const compressedFile = await imageCompression(file, options);
          return compressedFile;
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Image Compression Failed",
              description: "Could not process the image. Please try a different one or a smaller file.",
          });
          console.error("Image compression error:", error);
          return null;
      }
  };


  const handleGenerateDetails = async () => {
    const { initialDescription } = form.getValues();

    if (!initialDescription) {
      form.trigger('initialDescription');
      return;
    }

    setIsGenerating(true);
    setHasGenerated(false);
    
    const compressedImage = await getCompressedImage();
    if (!compressedImage) {
        setIsGenerating(false);
        return;
    }

    try {
      const imageDataUrl = await fileToBase64(compressedImage);
      const result = await extractListingDetails({
        userDescription: initialDescription,
        productImage: imageDataUrl,
      });
      
      form.setValue('productName', result.productName, { shouldValidate: true });
      form.setValue('productDescription', result.productDescription, { shouldValidate: true });
      form.setValue('price', result.price, { shouldValidate: true });
      form.setValue('category', result.category, { shouldValidate: true });
      form.setValue('subcategory', result.subcategory, { shouldValidate: true });
      form.setValue('condition', result.condition, { shouldValidate: true });

      setHasGenerated(true);
      toast({
        title: "Details Generated!",
        description: "The AI has created your listing details. Please review them below.",
      });
    } catch (error) {
      console.error("AI generation failed:", error);
      setHasGenerated(true); // Allow manual entry even if AI fails
      toast({
        variant: 'destructive',
        title: "AI Assistant couldn't generate details.",
        description: "No problem, please fill in the information manually.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit(values: ClientListingSchema) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a listing.',
      });
      return;
    }
    
    setIsSubmitting(true);
    const compressedImageFile = await getCompressedImage();

    if (!compressedImageFile) {
        toast({ variant: 'destructive', title: 'Image Missing', description: 'Please select an image and try again.' });
        setIsSubmitting(false);
        return;
    }

    const formData = new FormData();
    formData.append('productImage', compressedImageFile, compressedImageFile.name);
    formData.append('productName', values.productName);
    formData.append('productDescription', values.productDescription);
    formData.append('price', String(values.price));
    formData.append('category', values.category);
    formData.append('subcategory', values.subcategory);
    formData.append('condition', values.condition);

    try {
      const result = await createListing(user.id, formData);
      
      if (!result.success) {
        throw new Error(result.message || 'An unexpected error occurred during submission.');
      }
      
      toast({
          title: "Listing Submitted!",
          description: "Your item is now under review by our team.",
      });
      router.push('/my-listings');

    } catch (error: any) {
      console.error('Error calling create listing action:', error);
      toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const selectedCategory = form.watch('category');


  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
              <LogIn className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-center">You need to be logged in</CardTitle>
          <CardDescription className="text-center">
            Please log in or create an account to sell your items on CloudStore.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/login?redirect=/listings/new">Login</Link>
          </Button>
           <Button asChild variant="outline">
            <Link href="/register">Create Account</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 p-6 border-dashed border-2 rounded-lg bg-muted/30">
          <h3 className="text-lg font-semibold">1. Describe Your Item</h3>
          <FormField
            control={form.control}
            name="productImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*"
                    {...productImageRef}
                    disabled={isFormProcessing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="initialDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe your item, its condition, and price</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. I'm selling a slightly used brown leather armchair. It's in great condition, just a small scuff on the left arm. Asking for around 8000 Rs."
                    rows={4}
                    {...field}
                    disabled={isFormProcessing}
                  />
                </FormControl>
                 <FormDescription>
                    Be as descriptive as possible. Our AI will use this to generate the listing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <Button
              type="button"
              onClick={handleGenerateDetails}
              disabled={isFormProcessing}
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Listing Details
            </Button>
        </div>

        {hasGenerated && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">2. Review and Submit</h3>
                <Button type="button" variant="ghost" size="sm" onClick={() => setHasGenerated(false)} disabled={isFormProcessing}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Over
                </Button>
            </div>
            <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Listing Title</FormLabel>
                    <FormControl>
                        <Input {...field} disabled={isFormProcessing} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="pl-8"
                                step="0.01"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? null : Number(value));
                                }}
                                disabled={isFormProcessing}
                            />
                            </FormControl>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isFormProcessing}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a condition" /></SelectValue>
                        </FormControl>
                        <SelectContent>
                            {conditions.map(con => (
                            <SelectItem key={con} value={con}>{con}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isFormProcessing}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectValue>
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory || isFormProcessing}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectValue>
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
             <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                        <Textarea rows={6} {...field} disabled={isFormProcessing} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isFormProcessing}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Submitting for Review...' : 'Submit for Review'}
          </Button>
        </div>
        )}
      </form>
    </Form>
  );
}
