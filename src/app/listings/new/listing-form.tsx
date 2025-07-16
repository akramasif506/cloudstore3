
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
import { Loader2, Frown, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createListingDraft, finalizeListing } from './actions';
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
  const [submissionStep, setSubmissionStep] = useState<'idle' | 'saving_draft' | 'uploading_image' | 'finalizing'>('idle');
  const [imageProcessingState, setImageProcessingState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImageFile, setCompressedImageFile] = useState<File | null>(null);

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
    if (!user || !compressedImageFile) {
      toast({ variant: "destructive", title: 'Missing Information', description: 'Please ensure you are logged in and have selected an image.' });
      return;
    }

    // Step 1: Save the draft with text data
    setSubmissionStep('saving_draft');
    const draftResult = await createListingDraft({
      productName: values.productName,
      productDescription: values.productDescription,
      price: values.price,
      category: values.category,
      subcategory: values.subcategory,
      condition: values.condition,
    });

    if (!draftResult.success || !draftResult.productId) {
      toast({ variant: "destructive", title: 'Failed to Save Draft', description: draftResult.message || "Could not save your listing details." });
      setSubmissionStep('idle');
      return;
    }
    
    toast({ title: 'Draft Saved!', description: 'Now uploading your image...' });
    const productId = draftResult.productId;

    // Step 2: Upload the image
    setSubmissionStep('uploading_image');
    let imageUrl = '';
    try {
      imageUrl = await uploadImageAndGetUrl(compressedImageFile, user.id);
    } catch (uploadError) {
      toast({
        variant: "default",
        title: "Image Upload Failed",
        description: "Your listing draft is saved. You can add the image later from 'My Listings'.",
        duration: 8000
      });
      router.push(`/my-listings`); // Redirect user to their listings page
      return; // Stop the process here
    }

    // Step 3: Finalize the listing with the image URL
    setSubmissionStep('finalizing');
    const finalizeResult = await finalizeListing(productId, imageUrl);

    if (finalizeResult.success) {
      toast({ title: 'Listing Submitted!', description: 'Your item is now pending review.' });
      router.push(`/my-listings`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Finalization Failed',
        description: `Your draft was saved, but we couldn't attach the image. Please edit the listing later. Error: ${finalizeResult.message}`
      });
       router.push(`/my-listings`);
    }
    
    setSubmissionStep('idle');
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Clear previous image states without resetting the whole form
    setImagePreview(null);
    setCompressedImageFile(null);
    setImageProcessingState('idle');
    form.setValue('productImage', null);

    if (file) {
      setImageProcessingState('processing');

      try {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressedFile);
        form.setValue('productImage', dataTransfer.files, { shouldValidate: true });
        
        setCompressedImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
        setImageProcessingState('done');

      } catch (error) {
        console.error("Image compression failed:", error);
        toast({
            variant: "default", // Softer, non-destructive color
            title: "Image Processing Failed",
            description: "Please try selecting a different image. Standard formats like JPG and PNG work best.",
        });
        setImageProcessingState('idle');
      }
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

  const isSubmitting = submissionStep !== 'idle';
  const isImageReady = imageProcessingState === 'done' && compressedImageFile !== null;
  let buttonText = 'Submit Listing';
  if (submissionStep === 'saving_draft') buttonText = 'Saving details...';
  if (submissionStep === 'uploading_image') buttonText = 'Uploading image...';
  if (submissionStep === 'finalizing') buttonText = 'Finalizing...';

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
                                <>
                                    <Image src={imagePreview} alt="Product preview" fill className="object-cover rounded-lg" />
                                    {imageProcessingState === 'processing' && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <span>Processing...</span>
                                        </div>
                                    )}
                                    {imageProcessingState === 'done' && (
                                         <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {imageProcessingState === 'processing' ? (
                                      <div className="flex flex-col items-center justify-center text-white">
                                          <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                                          <span className="text-muted-foreground">Processing...</span>
                                      </div>
                                    ) : (
                                      <>
                                          <ImageIcon className="h-12 w-12 mb-2" />
                                          <span>Click or tap to upload an image</span>
                                      </>
                                    )}
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
                        onChange={handleImageChange}
                        disabled={isSubmitting || imageProcessingState === 'processing'}
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
                <Input placeholder="e.g. Vintage Leather Armchair" {...field} disabled={isSubmitting}/>
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
                <Textarea placeholder="Describe your item in detail, including its condition, age, and any flaws." rows={6} {...field} disabled={isSubmitting}/>
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
                  disabled={isSubmitting}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory || isSubmitting}>
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
                      disabled={isSubmitting}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
        
        <Button type="submit" disabled={isSubmitting || !isImageReady} size="lg">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}
