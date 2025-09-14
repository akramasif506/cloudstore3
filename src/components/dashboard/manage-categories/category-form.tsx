
"use client";

import { useState, useEffect } from 'react';
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
import { Loader2, PlusCircle, Trash2, Save, Tags, GripVertical, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { CategoryMap, Category, Subcategory, VariantAttribute } from '@/app/dashboard/manage-categories/actions';
import { saveSingleCategory, deleteCategory, createNewCategory } from '@/app/dashboard/manage-categories/actions';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { VariantSetMap } from '@/app/dashboard/manage-variants/actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import _ from 'lodash';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const variantAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name cannot be empty.'),
  variantSetId: z.string().optional(),
});

const subcategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name cannot be empty.'),
  enabled: z.boolean(),
  taxPercent: z.coerce.number().min(0).optional(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Category name cannot be empty.'),
  enabled: z.boolean(),
  subcategories: z.array(subcategorySchema),
  variantAttributes: z.array(variantAttributeSchema),
  taxPercent: z.coerce.number().min(0).optional(),
});

const formSchema = z.object({
  categories: z.array(categorySchema),
  newCategoryName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
    initialCategories: CategoryMap;
    variantSets: VariantSetMap;
}

export function CategoryForm({ initialCategories, variantSets }: CategoryFormProps) {
  const [isSavingSingle, setIsSavingSingle] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newSubcategoryValues, setNewSubcategoryValues] = useState<Record<number, string>>({});
  const [newAttributeValues, setNewAttributeValues] = useState<Record<number, string>>({});
  const { toast } = useToast();
  
  const [initialFormState, setInitialFormState] = useState(() => _.cloneDeep(Object.values(initialCategories)));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: _.cloneDeep(initialFormState),
      newCategoryName: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'categories',
  });
  
  const watchedCategories = form.watch('categories');

  const handleAddCategory = async () => {
    const newCategoryName = form.getValues('newCategoryName');
    if (!newCategoryName || newCategoryName.trim() === '') return;

    if (fields.some(field => field.name.toLowerCase() === newCategoryName.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category already exists.' });
        return;
    }

    setIsAddingCategory(true);
    const result = await createNewCategory(newCategoryName);
    setIsAddingCategory(false);

    if (result.success && result.newCategory) {
        append(result.newCategory);
        setInitialFormState(current => [...current, _.cloneDeep(result.newCategory!)]);
        form.setValue('newCategoryName', '');
        toast({ title: 'Category Added!', description: `"${newCategoryName}" has been created.`});
    } else {
        toast({ variant: 'destructive', title: 'Failed to create category', description: result.message });
    }
  };

  const handleDeleteCategory = async (index: number, categoryId: string) => {
    setIsDeleting(prev => ({ ...prev, [categoryId]: true }));
    const result = await deleteCategory(categoryId);
    setIsDeleting(prev => ({ ...prev, [categoryId]: false }));

    if (result.success) {
      remove(index);
      setInitialFormState(current => current.filter(c => c.id !== categoryId));
      toast({ title: 'Category Deleted', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: result.message });
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
      const newSub: Subcategory = { name: newSubcategory, enabled: true, taxPercent: 0 };
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

  const handleAddAttribute = (categoryIndex: number) => {
    const newAttribute = newAttributeValues[categoryIndex];
    if (newAttribute && newAttribute.trim() !== '') {
      const categoryField = fields[categoryIndex];
      if (categoryField.variantAttributes.some(attr => attr.name.toLowerCase() === newAttribute.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Attribute already exists.' });
        return;
      }
      const newAttr: VariantAttribute = { name: newAttribute, variantSetId: '' };
      const updatedAttributes = [...categoryField.variantAttributes, newAttr];
      update(categoryIndex, { ...categoryField, variantAttributes: updatedAttributes });
      setNewAttributeValues(prev => ({ ...prev, [categoryIndex]: '' }));
    }
  };

  const handleRemoveAttribute = (categoryIndex: number, attributeIndex: number) => {
    const categoryField = fields[categoryIndex];
    const updatedAttributes = categoryField.variantAttributes.filter((_, i) => i !== attributeIndex);
    update(categoryIndex, { ...categoryField, variantAttributes: updatedAttributes });
  }

  const handleSaveCategory = async (index: number) => {
    const categoryData = form.getValues(`categories.${index}`);
    const categoryId = categoryData.id;
    
    const isValid = await form.trigger(`categories.${index}`);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please check the fields for errors before saving.",
      });
      return;
    }

    setIsSavingSingle(prev => ({ ...prev, [categoryId]: true }));
    
    const result = await saveSingleCategory(categoryData);
    
    setIsSavingSingle(prev => ({ ...prev, [categoryId]: false }));

    if (result.success) {
      const newInitialState = _.cloneDeep(initialFormState);
      const stateIndex = newInitialState.findIndex(c => c.id === categoryId);
      if (stateIndex !== -1) {
        newInitialState[stateIndex] = _.cloneDeep(categoryData);
      }
      setInitialFormState(newInitialState);
      toast({ title: 'Success!', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const NONE_VALUE = '_none_';

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="space-y-6">
            {fields.map((field, index) => {
                const initialCategoryState = initialFormState.find(c => c.id === field.id);
                const currentCategoryState = watchedCategories[index];
                const isCardDirty = !_.isEqual(currentCategoryState, initialCategoryState);

                return (
                <Card key={field.id} className={cn(!field.enabled && 'bg-muted/50 border-dashed')}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center flex-wrap gap-4">
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
                             <FormField
                                control={form.control}
                                name={`categories.${index}.name`}
                                render={({ field: nameField }) => (
                                  <Input
                                    {...nameField}
                                    className={cn("text-2xl font-headline h-auto p-0 border-none focus-visible:ring-0", !field.enabled && "text-muted-foreground line-through")}
                                  />
                                )}
                              />
                           </div>
                           <div className="flex items-center gap-4">
                            <FormField
                                control={form.control}
                                name={`categories.${index}.taxPercent`}
                                render={({ field: taxField }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                  <FormLabel>Default Tax</FormLabel>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      className="w-24"
                                      {...taxField}
                                      value={taxField.value || ''}
                                      onChange={(e) => taxField.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />
                                     <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  </div>
                                </FormItem>
                                )}
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={isDeleting[field.id]}>
                                  {isDeleting[field.id] ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the "{field.name}" category. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                                    onClick={() => handleDeleteCategory(index, field.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                           </div>
                        </CardTitle>
                        <CardDescription>ID: {field.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* SUBCATEGORIES SECTION */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-1 flex items-center gap-2"><GripVertical className="h-5 w-5 text-muted-foreground" /> Subcategories</h4>
                            <p className="text-sm text-muted-foreground mb-4">Manage the subcategories for {field.name}.</p>
                            
                            <div className="space-y-2">
                            {field.subcategories.map((sub, subIndex) => (
                                <div key={`${field.id}-sub-${subIndex}`} className="flex items-center gap-4 p-2 border rounded-md bg-background">
                                    <Controller
                                        control={form.control}
                                        name={`categories.${index}.subcategories.${subIndex}.enabled`}
                                        render={({ field: switchField }) => (
                                            <Switch
                                                checked={switchField.value}
                                                onCheckedChange={switchField.onChange}
                                                aria-label={`${sub.name} subcategory status`}
                                            />
                                        )}
                                    />
                                    <span className={cn('flex-grow', !sub.enabled && 'text-muted-foreground line-through')}>{sub.name}</span>

                                    <FormField
                                        control={form.control}
                                        name={`categories.${index}.subcategories.${subIndex}.taxPercent`}
                                        render={({ field: taxField }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                          <FormLabel className="text-xs">Tax</FormLabel>
                                          <div className="relative">
                                            <Input
                                              type="number"
                                              className="w-20 h-8"
                                              placeholder="Default"
                                              {...taxField}
                                              value={taxField.value || ''}
                                              onChange={(e) => taxField.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                            />
                                            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                          </div>
                                        </FormItem>
                                        )}
                                    />

                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleRemoveSubcategory(index, subIndex)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            </div>

                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor={`new-subcategory-${index}`} className="text-xs text-muted-foreground">New Subcategory Name</Label>
                                        <Input
                                            id={`new-subcategory-${index}`}
                                            placeholder="e.g. Fiction Books"
                                            value={newSubcategoryValues[index] || ''}
                                            onChange={(e) => setNewSubcategoryValues(prev => ({...prev, [index]: e.target.value}))}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => handleAddSubcategory(index)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* VARIANT ATTRIBUTES SECTION */}
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-1 flex items-center gap-2"><Tags className="h-5 w-5 text-muted-foreground" /> Variant Attributes</h4>
                            <p className="text-sm text-muted-foreground mb-4">Define product options like 'Color' or 'Size' for this category.</p>

                             <div className="space-y-4">
                                {field.variantAttributes.map((attr, attrIndex) => (
                                    <div key={`${field.id}-attr-${attrIndex}`} className="flex items-center gap-2 p-2 border rounded-md">
                                        <span className="font-medium flex-shrink-0">{attr.name}</span>
                                        <Controller
                                          control={form.control}
                                          name={`categories.${index}.variantAttributes.${attrIndex}.variantSetId`}
                                          render={({ field: selectField }) => (
                                            <Select
                                                onValueChange={(value) => selectField.onChange(value === NONE_VALUE ? '' : value)}
                                                value={selectField.value || NONE_VALUE}
                                            >
                                              <SelectTrigger><SelectValue placeholder="Link a variant set..." /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value={NONE_VALUE}>None (Free Text)</SelectItem>
                                                {Object.entries(variantSets).map(([setId, set]) => (
                                                  <SelectItem key={setId} value={setId}>{set.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveAttribute(index, attrIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t mt-4">
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor={`new-attribute-${index}`} className="text-xs text-muted-foreground">New Attribute Name</Label>
                                        <Input
                                            id={`new-attribute-${index}`}
                                            placeholder="e.g. Size"
                                            value={newAttributeValues[index] || ''}
                                            onChange={(e) => setNewAttributeValues(prev => ({...prev, [index]: e.target.value}))}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => handleAddAttribute(index)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                     <CardFooter className="flex justify-end bg-muted/50 p-4">
                        <Button type="button" onClick={() => handleSaveCategory(index)} disabled={isSavingSingle[field.id] || !isCardDirty}>
                            {isSavingSingle[field.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save This Category
                        </Button>
                    </CardFooter>
                </Card>
            )})}
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
                                <FormControl><Input placeholder="e.g. Books" {...field} disabled={isAddingCategory} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleAddCategory} disabled={isAddingCategory}>
                        {isAddingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add Category
                    </Button>
                </div>
            </CardContent>
        </Card>
      </form>
    </Form>
  );
}
