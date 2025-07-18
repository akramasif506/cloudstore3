
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
import { updateProduct } from './actions';
import { updateProductSchema } from '@/lib/schemas/product';
import type { CategoryMap } from '../manage-categories/actions';

interface EditProductDialogProps {
  product: Product;
  categories: CategoryMap;
  onSuccess: (product: Product) => void;
  onError: (message: string) => void;
}

export function EditProductDialog({ product, categories, onSuccess, onError }: EditProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof updateProductSchema>>({
        resolver: zodResolver(updateProductSchema),
        defaultValues: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            subcategory: product.subcategory,
            condition: product.condition || 'Used',
        },
    });

    const selectedCategory = form.watch('category');

    async function onSubmit(values: z.infer<typeof updateProductSchema>) {
        setIsSubmitting(true);
        const result = await updateProduct(values);
        if (result.success) {
            onSuccess({ ...product, ...values });
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
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                        Modify the product details below.
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
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategory}>
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
                                    />
                                    </FormControl>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
