
"use client";

import { useForm, useFieldArray } from 'react-hook-form';
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
import { useState, useEffect } from 'react';
import { Loader2, Frown, Image as ImageIcon, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createListingDraft, finalizeListing } from './actions';
import { listingSchema } from '@/lib/schemas';
import Image from 'next/image';
import { uploadImageAndGetUrl } from '@/lib/storage';
import imageCompression from 'browser-image-compression';
import { generateDescription } from '@/ai/flows/generate-description-flow';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import type { VariantSetMap } from '@/app/dashboard/manage-variants/actions';
import { Separator } from '@/components/ui/separator';
import type { ProductConditionMap } from '@/app/dashboard/manage-product-conditions/actions';

const formSchema = listingSchema;

// Helper function to convert a File object to a Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface ListingFormProps {
  categories: CategoryMap;
  variantSets: VariantSetMap;
  conditions: ProductConditionMap;
}

export function ListingForm({ categories, variantSets, conditions }: ListingFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [submissionStep, setSubmissionStep] = useState<'idle' | 'saving_draft' | 'uploading_image' | 'finalizing'>('idle');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImageFile, setCompressedImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const enabledConditions = Object.entries(conditions)
    .filter(([_, data]) => data.enabled)
    .map(([name]) => name);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      productDescription: '',
      price: undefined,
      originalPrice: undefined,
      category: '',
      subcategory: '',
      condition: enabledConditions.includes('Used') ? 'Used' : 'New',
      stock: 1,
      variants: [],
      seller: { id: '', name: '', contactNumber: '' }, // Initial empty seller
    },
  });
  
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const selectedCategoryId = form.watch('category');
  
  useEffect(() => {
    if (user) {
      form.setValue('seller', {
        id: user.id,
        name: user.name || 'CloudStore Seller',
        contactNumber: user.mobileNumber || ''
      });
    }
  }, [user, form]);
  
  useEffect(() => {
    const categoryData = categories[selectedCategoryId];
    const newVariantFields = categoryData?.variantAttributes?.map(attr => ({
      name: attr.name,
      value: '', // Default to empty
    })) || [];
    replace(newVariantFields);
  }, [selectedCategoryId, categories, replace]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: 'Not Logged In', description: 'Please log in to create a listing.' });
      return;
    }
    if (!compressedImageFile) {
      toast({ variant: "destructive", title: 'Image Required', description: 'Please select an image for your listing.' });
      return;
    }

    setSubmissionStep('saving_draft');
    // The seller info is already in `values` due to the useEffect hook
    const draftResult = await createListingDraft(values);

    if (!draftResult.success || !draftResult.productId) {
      toast({ variant: "destructive", title: 'Failed to Save Draft', description: draftResult.message || "Could not save your listing details." });
      setSubmissionStep('idle');
      return;
    }
    
    toast({ title: 'Draft Saved!', description: 'Now uploading your image...' });
    const productId = draftResult.productId;

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
      router.push(`/my-listings`); 
      return;
    }

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
    
    setImagePreview(null);
    setCompressedImageFile(null);
    setImageError(null);

    if (!file) return;

    try {
      const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      setCompressedImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));

    } catch (error) {
      console.error("Image compression failed:", error);
      setImageError("Image processing failed. Please try a different image.");
      toast({
            variant: "default",
            title: "Image Processing Failed",
            description: "Please try selecting a different image. Standard formats like JPG and PNG work best.",
      });
    }
  };

  const handleGenerateDescription = async () => {
    const { productName, category: categoryId, subcategory } = form.getValues();
    const categoryName = categoryId ? categories[categoryId]?.name : undefined;

    const basePayload = { productName, category: categoryName, subcategory };

    if (!productName) {
        toast({
            variant: 'destructive',
            title: 'Title is missing',
            description: 'Please enter a listing title first.'
        });
        return;
    }

    setIsGeneratingDescription(true);
    try {
        let photoDataUri: string | undefined = undefined;
        if (compressedImageFile) {
            try {
                photoDataUri = await fileToDataUri(compressedImageFile);
            } catch (e) {
                console.warn("Could not convert image to data URI for AI generation, falling back to text-only.");
            }
        }
        
        const result = await generateDescription({ ...basePayload, photoDataUri });

        if (result && result.description) {
            form.setValue('productDescription', result.description);
            toast({
                title: 'Description Generated!',
                description: 'The AI-powered description has been added.'
            });
        } else {
            throw new Error('No description was returned.');
        }

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Failed to Generate Description',
            description: 'The AI assistant could not generate a description. Please try again.'
        });
    } finally {
        setIsGeneratingDescription(false);
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
  let buttonText = 'Submit Listing';
  if (submissionStep === 'saving_draft') buttonText = 'Saving details...';
  if (submissionStep === 'uploading_image') buttonText = 'Uploading image...';
  if (submissionStep === 'finalizing') buttonText = 'Finalizing...';

  const enabledCategories = Object.values(categories).filter(cat => cat.enabled);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormItem>
          <FormLabel>Product Image</FormLabel>
          <FormControl>
              <div className="w-full">
                <label htmlFor="productImage" className="cursor-pointer">
                    <div className="relative w-full aspect-video border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        {imagePreview ? (
                            <>
                                <Image src={imagePreview} alt="Product preview" fill className="object-cover rounded-lg" />
                                <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            </>
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
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                />
            </div>
          </FormControl>
          <FormDescription>Max file size: 10MB. Accepted formats: JPG, PNG, WEBP.</FormDescription>
          {imageError && <p className="text-sm font-medium text-destructive">{imageError}</p>}
        </FormItem>
        
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
              <div className="flex justify-between items-center">
                <FormLabel>Description</FormLabel>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || !compressedImageFile}
                >
                    {isGeneratingDescription ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-accent" />
                    )}
                    Generate with AI
                </Button>
              </div>
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
                    form.setValue('variants', []);
                  }}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {enabledCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId || isSubmitting}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a subcategory" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedCategoryId && categories[selectedCategoryId]?.subcategories
                        .filter(sub => sub.enabled)
                        .map(subcat => (
                           <SelectItem key={subcat.name} value={subcat.name}>{subcat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {fields.length > 0 && (
          <Card className="bg-muted/50">
            <CardHeader><CardTitle>Product Options</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {fields.map((field, index) => {
                const attribute = categories[selectedCategoryId]?.variantAttributes?.[index];
                const variantSetId = attribute?.variantSetId;
                const options = variantSetId ? variantSets[variantSetId]?.options : [];
                return (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`variants.${index}.value`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{attribute?.name}</FormLabel>
                        {options && options.length > 0 ? (
                           <Select onValueChange={formField.onChange} defaultValue={formField.value} disabled={isSubmitting}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder={`Select ${attribute?.name}`} /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {options.map(option => (
                                  <SelectItem key={option.value} value={option.value}>{option.value}</SelectItem>
                                ))}
                              </SelectContent>
                           </Select>
                        ) : (
                          <FormControl>
                            <Input placeholder={`Enter ${attribute?.name}`} {...formField} disabled={isSubmitting}/>
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Current)</FormLabel>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">Rs</span>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1500.00"
                      className="pl-8"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>The final price after discount.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="originalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Price (Optional)</FormLabel>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">Rs</span>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 2000.00"
                      className="pl-8"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </div>
                <FormDescription>The price before discount (for display).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      {enabledConditions.map(con => (
                        <SelectItem key={con} value={con}>{con}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 1" 
                      {...field} 
                      disabled={isSubmitting}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>Number of items available for sale.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <Button type="submit" disabled={isSubmitting || !compressedImageFile} size="lg">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    </Form>
  );
}
