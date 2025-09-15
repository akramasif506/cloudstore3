
// src/app/dashboard/pending-products/edit-product-dialog.tsx
"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Edit } from 'lucide-react';
import type { Product } from '@/lib/types';
import { updateAndApproveProduct } from './actions';
import { updateProductSchema } from '@/lib/schemas/product';
import type { CategoryMap } from '../manage-categories/actions';
import type { ProductConditionMap } from '../manage-product-conditions/actions';

interface EditProductDialogProps {
  product: Product;
  categories: CategoryMap;
  conditions: ProductConditionMap;
  onSuccess: (productId: string) => void;
  onError: (message: string) => void;
}

export function EditProductDialog({ product, categories, conditions, onSuccess, onError }: EditProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const enabledConditions = Object.entries(conditions)
        .filter(([_, data]) => data.enabled)
        .map(([name]) => name);

    const form = useForm<z.infer<typeof updateProductSchema>>({
        resolver: zodResolver(updateProductSchema),
        defaultValues: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice || undefined,
            category: product.category,
            subcategory: product.subcategory,
            condition: product.condition || 'Used',
        },
    });

    const selectedCategoryId = form.watch('category');
    const enabledCategories = Object.values(categories).filter(cat => cat.enabled);

    async function onSubmit(values: z.infer<typeof updateProductSchema>) {
        setIsSubmitting(true);
        const result = await updateAndApproveProduct(values);
        if (result.success) {
            onSuccess(product.id);
            setOpen(false);
        } else {
            onError(result.message || 'An unknown error occurred.');
        }
        setIsSubmitting(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" /> Edit & Approve
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit & Approve Product</DialogTitle>
                    <DialogDescription>
                        Modify the product details below and approve the listing.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your item in detail..." rows={4} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            placeholder="0.00"
                                            className="pl-8"
                                            step="0.01"
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
                             <FormField
                                control={form.control}
                                name="originalPrice"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Original Price</FormLabel>
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
                                            field.onChange(value === '' ? undefined : Number(value));
                                            }}
                                            value={field.value ?? ''}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormDescription>Leave blank if not on sale.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1">
                             <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update & Approve
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
