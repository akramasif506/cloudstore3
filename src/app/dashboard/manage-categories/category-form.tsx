
"use client";

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategoryMap, Category, Subcategory } from './actions';
import { saveCategories } from './actions';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name cannot be empty.'),
  enabled: z.boolean(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty.'),
  enabled: z.boolean(),
  subcategories: z.array(subcategorySchema),
});

const formSchema = z.object({
  categories: z.array(categorySchema),
  newCategoryName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
    initialCategories: CategoryMap;
}

export function CategoryForm({ initialCategories }: CategoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [newSubcategoryValues, setNewSubcategoryValues] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: Object.entries(initialCategories).map(([name, categoryData]) => ({
        name,
        enabled: categoryData.enabled,
        subcategories: categoryData.subcategories,
      })),
      newCategoryName: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'categories',
  });

  const handleAddCategory = () => {
    const newCategoryName = form.getValues('newCategoryName');
    if (newCategoryName && newCategoryName.trim() !== '') {
      if (fields.some(field => field.name.toLowerCase() === newCategoryName.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category already exists.' });
        return;
      }
      append({ name: newCategoryName, subcategories: [], enabled: true });
      form.setValue('newCategoryName', '');
    }
  };

  const handleAddSubcategory = (categoryIndex: number) => {
    const newSubcategory = newSubcategoryValues[categoryIndex];
    if (newSubcategory && newSubcategory.trim() !== '') {
      const categoryField = fields[categoryIndex];
      if (categoryField.subcategories.some(sub => sub.name.toLowerCase() === newSubcategory.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Subcategory already exists.' });
        return;
      }
      const newSub: Subcategory = { name: newSubcategory, enabled: true };
      const updatedSubcategories = [...categoryField.subcategories, newSub];
      update(categoryIndex, { ...categoryField, subcategories: updatedSubcategories });
      setNewSubcategoryValues(prev => ({ ...prev, [categoryIndex]: '' }));
    }
  };
  
  const handleRemoveSubcategory = (categoryIndex: number, subcategoryIndex: number) => {
    const categoryField = fields[categoryIndex];
    const updatedSubcategories = categoryField.subcategories.filter((_, i) => i !== subcategoryIndex);
    update(categoryIndex, { ...categoryField, subcategories: updatedSubcategories });
  }

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    const categoryMap: CategoryMap = data.categories.reduce((acc, category) => {
      acc[category.name] = {
        enabled: category.enabled,
        subcategories: category.subcategories,
      };
      return acc;
    }, {} as CategoryMap);
    
    const result = await saveCategories(categoryMap);
    
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Success!', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className={cn(!field.enabled && 'bg-muted/50')}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <div className="flex items-center gap-4">
                            <Controller
                                control={form.control}
                                name={`categories.${index}.enabled`}
                                render={({ field: switchField }) => (
                                    <Switch
                                        checked={switchField.value}
                                        onCheckedChange={switchField.onChange}
                                        aria-label={`${field.name} category status`}
                                    />
                                )}
                            />
                            <span className={cn(!field.enabled && 'text-muted-foreground line-through')}>{field.name}</span>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                               <Trash2 className="h-5 w-5" />
                           </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 min-h-[30px]">
                           {field.subcategories.map((sub, subIndex) => (
                                <div key={`${field.id}-sub-${subIndex}`} className="flex items-center gap-2">
                                   <Controller
                                        control={form.control}
                                        name={`categories.${index}.subcategories.${subIndex}.enabled`}
                                        render={({ field: switchField }) => (
                                            <Switch
                                                checked={switchField.value}
                                                onCheckedChange={switchField.onChange}
                                                className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0.5"
                                                aria-label={`${sub.name} subcategory status`}
                                            />
                                        )}
                                    />
                                    <Badge variant="secondary" className={cn("text-sm py-1 px-3", !sub.enabled && 'text-muted-foreground line-through')}>
                                        {sub.name}
                                        <Button type="button" variant="ghost" size="icon" className="ml-1 h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveSubcategory(index, subIndex)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                </div>
                           ))}
                        </div>
                         <div className="pt-4 border-t">
                            <div className="flex items-end gap-4">
                               <div className="flex-grow">
                                    <Label htmlFor={`new-subcategory-${index}`}>New Subcategory</Label>
                                    <Input
                                        id={`new-subcategory-${index}`}
                                        placeholder="e.g. Fiction"
                                        value={newSubcategoryValues[index] || ''}
                                        onChange={(e) => setNewSubcategoryValues(prev => ({...prev, [index]: e.target.value}))}
                                    />
                                </div>
                                <Button type="button" onClick={() => handleAddSubcategory(index)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Subcategory
                                </Button>
                             </div>
                         </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Card>
            <CardHeader><CardTitle>Add New Category</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <FormField
                        control={form.control}
                        name="newCategoryName"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>New Category Name</FormLabel>
                                <FormControl><Input placeholder="e.g. Books" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleAddCategory}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
