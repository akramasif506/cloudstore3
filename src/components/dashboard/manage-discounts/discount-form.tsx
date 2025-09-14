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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Save, Tags, GripVertical, Percent, Tag, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DiscountMap, Discount } from '@/app/dashboard/manage-discounts/actions';
import { saveDiscounts } from '@/app/dashboard/manage-discounts/actions';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const discountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Rule name cannot be empty.'),
  pincodes: z.array(z.string().regex(/^\d{6}$/, "Must be a 6-digit PIN code.")),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(0, "Value cannot be negative."),
  enabled: z.boolean(),
});

const formSchema = z.object({
  discounts: z.array(discountSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface DiscountFormProps {
    initialDiscounts: DiscountMap;
}


export function DiscountForm({ initialDiscounts }: DiscountFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [newPincodeValues, setNewPincodeValues] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discounts: Object.entries(initialDiscounts).map(([id, discountData]) => ({
        id,
        ...discountData
      })),
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'discounts',
  });

  const handleAddDiscountRule = () => {
    const newId = uuidv4();
    append({
        id: newId,
        name: `New Discount Rule`,
        pincodes: [],
        type: 'percentage',
        value: 10,
        enabled: true
    });
  };

  const handleAddPincode = (discountIndex: number) => {
    const newPincode = newPincodeValues[discountIndex];
    if (newPincode && /^\d{6}$/.test(newPincode)) {
      const discountField = fields[discountIndex];
      if (discountField.pincodes.includes(newPincode)) {
        toast({ variant: 'destructive', title: 'PIN code already added.' });
        return;
      }
      const updatedPincodes = [...discountField.pincodes, newPincode];
      update(discountIndex, { ...discountField, pincodes: updatedPincodes });
      setNewPincodeValues(prev => ({ ...prev, [discountIndex]: '' }));
    } else {
        toast({ variant: 'destructive', title: 'Invalid PIN Code', description: 'Please enter a valid 6-digit PIN code.' });
    }
  };
  
  const handleRemovePincode = (discountIndex: number, pincodeIndex: number) => {
    const discountField = fields[discountIndex];
    const updatedPincodes = discountField.pincodes.filter((_, i) => i !== pincodeIndex);
    update(discountIndex, { ...discountField, pincodes: updatedPincodes });
  }


  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    const discountMap: DiscountMap = data.discounts.reduce((acc, discount) => {
      const { id, ...rest } = discount;
      acc[id] = rest;
      return acc;
    }, {} as DiscountMap);
    
    const result = await saveDiscounts(discountMap);
    
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
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
                Create rules to apply automatic discounts for customers at checkout based on their shipping address PIN code. Note: this feature is not yet fully integrated into the checkout flow.
            </AlertDescription>
        </Alert>

        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className={cn(!field.enabled && 'bg-muted/50 border-dashed')}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                           <div className="flex items-center gap-4">
                                <FormField
                                    control={form.control}
                                    name={`discounts.${index}.name`}
                                    render={({ field }) => (
                                        <Input {...field} className="text-2xl font-headline h-auto p-0 border-none focus-visible:ring-0" />
                                    )}
                                />
                           </div>
                           <div className="flex items-center gap-4">
                                <Controller
                                    control={form.control}
                                    name={`discounts.${index}.enabled`}
                                    render={({ field: switchField }) => (
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`enabled-switch-${index}`} className={cn(switchField.value ? "text-green-600" : "text-muted-foreground")}>
                                                {switchField.value ? "Enabled" : "Disabled"}
                                            </Label>
                                            <Switch
                                                id={`enabled-switch-${index}`}
                                                checked={switchField.value}
                                                onCheckedChange={switchField.onChange}
                                            />
                                        </div>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                           </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pincodes Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                            <h4 className="font-semibold flex items-center gap-2"><GripVertical className="h-5 w-5 text-muted-foreground" /> Applicable PIN Codes</h4>
                            
                            <div className="flex flex-wrap gap-2 min-h-[40px] bg-background/50 rounded-md p-2">
                            {field.pincodes.map((pincode, pincodeIndex) => (
                                    <Badge key={`${field.id}-pincode-${pincodeIndex}`} variant="secondary" className="text-sm py-1.5 px-3 flex items-center gap-2">
                                        <span>{pincode}</span>
                                        <button type="button" className="ml-1 text-destructive hover:text-destructive/80" onClick={() => handleRemovePincode(index, pincodeIndex)}>
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </Badge>
                            ))}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor={`new-pincode-${index}`} className="text-xs text-muted-foreground">New 6-Digit PIN Code</Label>
                                        <Input
                                            id={`new-pincode-${index}`}
                                            placeholder="e.g. 110001"
                                            value={newPincodeValues[index] || ''}
                                            onChange={(e) => setNewPincodeValues(prev => ({...prev, [index]: e.target.value}))}
                                            maxLength={6}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => handleAddPincode(index)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {/* Discount Type & Value Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                            <h4 className="font-semibold">Discount Details</h4>
                            <FormField
                                control={form.control}
                                name={`discounts.${index}.type`}
                                render={({ field: radioField }) => (
                                    <RadioGroup
                                    onValueChange={radioField.onChange}
                                    value={radioField.value}
                                    className="grid grid-cols-2 gap-4"
                                    >
                                        <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            <RadioGroupItem value="percentage" className="sr-only" />
                                            <Percent className="mb-3 h-6 w-6" />
                                            Percentage
                                        </Label>
                                         <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            <RadioGroupItem value="fixed" className="sr-only" />
                                            <Tag className="mb-3 h-6 w-6" />
                                            Fixed Amount
                                        </Label>
                                    </RadioGroup>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`discounts.${index}.value`}
                                render={({ field: inputField }) => (
                                    <FormItem>
                                        <FormLabel>Value</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...inputField} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleAddDiscountRule}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Discount Rule
            </Button>
            <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save All Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
