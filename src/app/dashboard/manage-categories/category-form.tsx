
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategoryMap } from './actions';
import { Label } from '@/components/ui/label';

const categorySchema = z.object({
  newCategory: z.string().optional(),
  newSubcategory: z.string().optional(),
});

interface CategoryFormProps {
    initialCategories: CategoryMap;
}

export function CategoryForm({ initialCategories }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
        newCategory: '',
        newSubcategory: '',
    },
  });

  async function handleAddCategory(values: z.infer<typeof categorySchema>) {
    // This will be implemented in the next step
    console.log('Adding new category:', values.newCategory);
    toast({ title: "Note", description: "Adding categories will be implemented next." });
  }
  
  async function handleAddSubcategory(category: string) {
    // This will be implemented in the next step
    console.log('Adding new subcategory to:', category);
    toast({ title: "Note", description: "Adding subcategories will be implemented next." });
  }

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
            <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddCategory)} className="flex items-end gap-4">
                    <FormField
                        control={form.control}
                        name="newCategory"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>New Category Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Books" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xl font-headline mb-4">Existing Categories</h3>
        <div className="space-y-6">
            {Object.entries(categories).map(([category, subcategories]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <span>{category}</span>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                               <Trash2 className="h-5 w-5" />
                           </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                           {subcategories.map(sub => (
                               <Badge key={sub} variant="secondary" className="text-sm py-1 px-3">
                                   {sub}
                                   <Button variant="ghost" size="icon" className="ml-1 h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10">
                                       <Trash2 className="h-3 w-3" />
                                   </Button>
                               </Badge>
                           ))}
                        </div>
                         <div className="pt-4 border-t">
                             <form onSubmit={() => handleAddSubcategory(category)} className="flex items-end gap-4">
                                <div className="flex-grow">
                                    <Label>New Subcategory</Label>
                                    <Input placeholder="e.g. Fiction" />
                                </div>
                                <Button type="submit">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Subcategory
                                </Button>
                             </form>
                         </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
