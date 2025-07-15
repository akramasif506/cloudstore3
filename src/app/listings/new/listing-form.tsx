
"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Frown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createListing } from './actions';
import { listingSchema } from '@/lib/schemas';
import Image from 'next/image';
import { uploadImageAndGetUrl } from '@/lib/storage';
import imageCompression from 'browser-image-compression';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = listingSchema.extend({
    productImage: z.any()
        .refine((files) => files?.length == 1, "An image of your product is required.")
        .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(
          (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
          "Only .jpg, .jpeg, .png and .webp formats are supported."
        ),
});


export function ListingForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [submissionStep, setSubmissionStep] = useState<'idle' | 'compressing' | 'uploading' | 'saving'>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      price: null,
      category: '',
      subcategory: '',
      condition: 'Used',
      productImage: undefined,
    },
  });

  const productImageRef = form.register("productImage");
  const selectedCategory = form.watch('category');


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Issue', description: 'You must be logged in to create a listing.' });
      return;
    }

    try {
        setSubmissionStep('compressing');
        const imageFile = values.productImage[0];
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        }
        const compressedFile = await imageCompression(imageFile, options);

        setSubmissionStep('uploading');
        const imageUrl = await uploadImageAndGetUrl(compressedFile, user.id);
    
        setSubmissionStep('saving');
        const result = await createListing({
            ...values,
            price: values.price!, // Zod ensures it's not null here
            imageUrl,
        });

        if (result.success && result.productId) {
          toast({ title: 'Listing Submitted!', description: 'Your item is now pending review.' });
          router.push(`/my-listings`);
        } else {
          // This will handle specific server-side validation errors if they are returned.
          throw new Error(result.message || 'An unknown error occurred on the server.');
        }

    } catch (error) {
        console.error("Submission failed:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Please try again with a different image.",
        });
    } finally {
        setSubmissionStep('idle');
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };


  if (!user) {
    return (
      <Card className="flex flex-col items-center justify-center text-center py-20 border-dashed">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
            <Frown className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Please Log In</CardTitle>
          <CardDescription>You need to be logged in to create a new listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login?redirect=/listings/new')}>Go to Login Page</Button>
        </CardContent>
      </Card>
    );
  }

  const isProcessing = submissionStep !== 'idle';
  let buttonText = 'Submit Listing for Review';
  if (submissionStep === 'compressing') buttonText = 'Compressing image...';
  if (submissionStep === 'uploading') buttonText = 'Uploading image...';
  if (submissionStep === 'saving') buttonText = 'Saving listing...';

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
                 <div className="w-full">
                    <label htmlFor="productImage" className="cursor-pointer">
                        <div className="relative w-full aspect-video border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Product preview" fill className="object-cover rounded-lg" />
                            ) : (
                                <>
                                    <ImageIcon className="h-12 w-12 mb-2" />
                                    <span>Click or tap to upload an image</span>
                                </>
                            )}
                        </div>
                    </label>
                    <Input 
                        type="file" 
                        id="productImage"
                        className="sr-only"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')} 
                        {...productImageRef}
                        onChange={(e) => {
                            field.onChange(e.target.files);
                            handleImageChange(e);
                        }}
                        disabled={isProcessing}
                    />
                </div>
              </FormControl>
              <FormDescription>Max file size: 5MB. Accepted formats: JPG, PNG, WEBP.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Listing Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vintage Leather Armchair" {...field} disabled={isProcessing}/>
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
                <Textarea placeholder="Describe your item in detail, including its condition, age, and any flaws." rows={6} {...field} disabled={isProcessing}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  disabled={isProcessing}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory || isProcessing}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? null : Number(value));
                      }}
                      value={field.value ?? ''}
                      disabled={isProcessing}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isProcessing}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a condition" /></SelectTrigger>
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
        
        <Button type="submit" disabled={isProcessing} size="lg">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}
