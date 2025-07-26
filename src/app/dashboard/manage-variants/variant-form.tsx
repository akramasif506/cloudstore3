
"use client";

import { useState } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { VariantSetMap, VariantSet, VariantOption } from './actions';
import { saveVariantSets } from './actions';

const variantOptionSchema = z.object({
  value: z.string().min(1, 'Option value cannot be empty.'),
});

const variantSetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Set name cannot be empty.'),
  options: z.array(variantOptionSchema),
});

const formSchema = z.object({
  variantSets: z.array(variantSetSchema),
  newSetName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface VariantFormProps {
    initialVariantSets: VariantSetMap;
}

// Helper to convert kebab-case to Title Case
const toTitleCase = (str: string) =>
  str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

// Helper to convert a string to kebab-case
const toKebabCase = (str: string) =>
  str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/--+/g, '-');

export function VariantForm({ initialVariantSets }: VariantFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [newOptionValues, setNewOptionValues] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variantSets: Object.entries(initialVariantSets).map(([id, set]) => ({
        id,
        name: set.name,
        options: set.options,
      })),
      newSetName: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'variantSets',
  });

  const handleAddSet = () => {
    const newSetName = form.getValues('newSetName');
    if (newSetName && newSetName.trim() !== '') {
      const newSetId = toKebabCase(newSetName);
      if (fields.some(field => field.id === newSetId)) {
        toast({ variant: 'destructive', title: 'Variant set already exists.' });
        return;
      }
      append({ id: newSetId, name: newSetName, options: [] });
      form.setValue('newSetName', '');
    }
  };

  const handleAddOption = (setIndex: number) => {
    const newOptionValue = newOptionValues[setIndex];
    if (newOptionValue && newOptionValue.trim() !== '') {
      const setField = fields[setIndex];
       if (setField.options.some(opt => opt.value.toLowerCase() === newOptionValue.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Option already exists in this set.' });
        return;
      }
      const newOption: VariantOption = { value: newOptionValue };
      const updatedOptions = [...setField.options, newOption];
      update(setIndex, { ...setField, options: updatedOptions });
      setNewOptionValues(prev => ({ ...prev, [setIndex]: '' }));
    }
  };
  
  const handleRemoveOption = (setIndex: number, optionIndex: number) => {
    const setField = fields[setIndex];
    const updatedOptions = setField.options.filter((_, i) => i !== optionIndex);
    update(setIndex, { ...setField, options: updatedOptions });
  }

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    const variantSetMap: VariantSetMap = data.variantSets.reduce((acc, set) => {
      acc[set.id] = {
        name: set.name,
        options: set.options,
      };
      return acc;
    }, {} as VariantSetMap);
    
    const result = await saveVariantSets(variantSetMap);
    
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
                <Card key={field.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                           <span className="text-2xl font-headline">{field.name}</span>
                           <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                               <Trash2 className="h-5 w-5 mr-2" />
                               Remove Set
                           </Button>
                        </CardTitle>
                        <CardDescription>ID: {field.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 min-h-[40px] border rounded-lg p-4">
                        {field.options.map((option, optionIndex) => (
                            <Badge key={`${field.id}-opt-${optionIndex}`} variant="secondary" className="text-sm py-1.5 px-3 flex items-center gap-2">
                                <span>{option.value}</span>
                                <button type="button" className="ml-1 text-destructive hover:text-destructive/80" onClick={() => handleRemoveOption(index, optionIndex)}>
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Label htmlFor={`new-option-${index}`} className="text-xs text-muted-foreground">New Option Value</Label>
                                    <Input
                                        id={`new-option-${index}`}
                                        placeholder="e.g. Small, Red, 9 months"
                                        value={newOptionValues[index] || ''}
                                        onChange={(e) => setNewOptionValues(prev => ({...prev, [index]: e.target.value}))}
                                    />
                                </div>
                                <Button type="button" variant="outline" onClick={() => handleAddOption(index)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <Card>
            <CardHeader><CardTitle>Add New Variant Set</CardTitle></CardHeader>
            <CardContent>
                <div className="flex items-end gap-4">
                    <FormField
                        control={form.control}
                        name="newSetName"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>New Set Name</FormLabel>
                                <FormControl><Input placeholder="e.g. Apparel Sizes" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" onClick={handleAddSet}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Set
                    </Button>
                </div>
            </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
