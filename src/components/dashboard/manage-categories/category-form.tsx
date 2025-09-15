
"use client";

import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
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
import type { Category, Subcategory, VariantAttribute } from '@/app/dashboard/manage-categories/actions';
import { saveSingleCategory } from '@/app/dashboard/manage-categories/actions';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';


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

type FormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category: Category;
    variantSets: VariantSetMap;
    onSave: (updatedCategory: Category) => void;
    onDelete: () => void;
}

export function CategoryForm({ category, variantSets, onSave, onDelete }: CategoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  const { toast } = useToast();
  
  const [initialState, setInitialState] = useState(() => cloneDeep(category));

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: cloneDeep(category),
  });
  
  // Reset form when the selected category changes
  useEffect(() => {
    const newCategoryState = cloneDeep(category);
    form.reset(newCategoryState);
    setInitialState(newCategoryState);
  }, [category, form]);


  const { fields: subcategoryFields, append: appendSubcategory, remove: removeSubcategory } = useFieldArray({
    control: form.control,
    name: 'subcategories',
  });
  
  const { fields: attributeFields, append: appendAttribute, remove: removeAttribute } = useFieldArray({
    control: form.control,
    name: 'variantAttributes',
  });

  const watchedData = form.watch();
  const isDirty = !isEqual(watchedData, initialState);

  const handleAddSubcategory = () => {
    if (newSubcategory.trim() !== '') {
      if (subcategoryFields.some(sub => sub.name.toLowerCase() === newSubcategory.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Subcategory already exists.' });
        return;
      }
      appendSubcategory({ name: newSubcategory, enabled: true, taxPercent: 0 });
      setNewSubcategory('');
    }
  };

  const handleAddAttribute = () => {
    if (newAttribute.trim() !== '') {
      if (attributeFields.some(attr => attr.name.toLowerCase() === newAttribute.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Attribute already exists.' });
        return;
      }
      appendAttribute({ name: newAttribute, variantSetId: '' });
      setNewAttribute('');
    }
  };

  const handleSaveCategory = async (data: FormValues) => {
    setIsSaving(true);
    const result = await saveSingleCategory(data);
    setIsSaving(false);

    if (result.success) {
      setInitialState(cloneDeep(data)); // Update initial state to match new saved state
      onSave(data);
      toast({ title: 'Success!', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const NONE_VALUE = '_none_';

  return (
    <Form {...form}>
       <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Editing: {category.name}</AlertTitle>
        <AlertDescription>
          Changes made here will only affect this category. Click "Update Category" below to save your changes.
        </AlertDescription>
      </Alert>
      <form onSubmit={form.handleSubmit(handleSaveCategory)} className="space-y-8">
        <Card className={cn(!form.getValues('enabled') && 'bg-muted/50 border-dashed')}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Controller
                    control={form.control}
                    name="enabled"
                    render={({ field: switchField }) => (
                        <Switch
                            checked={switchField.value}
                            onCheckedChange={switchField.onChange}
                            aria-label={`${form.getValues('name')} category status`}
                        />
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field: nameField }) => (
                      <Input
                        {...nameField}
                        className={cn("text-2xl font-headline h-auto p-0 border-none focus-visible:ring-0", !form.getValues('enabled') && "text-muted-foreground line-through")}
                      />
                    )}
                />
              </div>
              <div className="flex items-center gap-4">
                <FormField
                    control={form.control}
                    name="taxPercent"
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
              </div>
            </CardTitle>
            <CardDescription>ID: {form.getValues('id')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* SUBCATEGORIES SECTION */}
            <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-1 flex items-center gap-2"><GripVertical className="h-5 w-5 text-muted-foreground" /> Subcategories</h4>
                <p className="text-sm text-muted-foreground mb-4">Manage the subcategories for {form.getValues('name')}.</p>
                <div className="space-y-2">
                {subcategoryFields.map((sub, subIndex) => (
                    <div key={sub.id} className="flex items-center gap-4 p-2 border rounded-md bg-background">
                        <Controller
                            control={form.control}
                            name={`subcategories.${subIndex}.enabled`}
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
                            name={`subcategories.${subIndex}.taxPercent`}
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
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => removeSubcategory(subIndex)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                </div>
                <div className="pt-4 border-t mt-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Label htmlFor={`new-subcategory`} className="text-xs text-muted-foreground">New Subcategory Name</Label>
                            <Input
                                id={`new-subcategory`}
                                placeholder="e.g. Fiction Books"
                                value={newSubcategory}
                                onChange={(e) => setNewSubcategory(e.target.value)}
                            />
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddSubcategory}>
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
                    {attributeFields.map((attr, attrIndex) => (
                        <div key={attr.id} className="flex items-center gap-2 p-2 border rounded-md">
                            <span className="font-medium flex-shrink-0">{attr.name}</span>
                            <Controller
                                control={form.control}
                                name={`variantAttributes.${attrIndex}.variantSetId`}
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
                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeAttribute(attrIndex)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="pt-4 border-t mt-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <Label htmlFor={`new-attribute`} className="text-xs text-muted-foreground">New Attribute Name</Label>
                            <Input
                                id={`new-attribute`}
                                placeholder="e.g. Size"
                                value={newAttribute}
                                onChange={(e) => setNewAttribute(e.target.value)}
                            />
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddAttribute}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end bg-muted/50 p-4">
                <Button type="submit" disabled={isSaving || !isDirty}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Category
                </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
