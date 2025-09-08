
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Info } from 'lucide-react';
import type { ProductConditionMap } from './actions';
import { saveProductConditions } from './actions';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  conditions: z.object({
    "New": z.object({ enabled: z.boolean() }),
    "Like New": z.object({ enabled: z.boolean() }),
    "Used": z.object({ enabled: z.boolean() }),
  })
});

type FormValues = z.infer<typeof formSchema>;

interface ConditionFormProps {
    initialConditions: ProductConditionMap;
}

export function ConditionForm({ initialConditions }: ConditionFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      conditions: initialConditions,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    
    const result = await saveProductConditions(data.conditions);
    
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Success!', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  return (
    <>
    <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
         Use the toggles to control which product conditions are available for sellers to select when creating a new listing. The "New" condition cannot be disabled.
        </AlertDescription>
    </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
            {Object.keys(initialConditions).map((conditionName) => (
                <FormField
                    key={conditionName}
                    control={form.control}
                    name={`conditions.${conditionName as keyof ProductConditionMap}.enabled`}
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">{conditionName}</FormLabel>
                            <FormDescription>
                                {conditionName === 'New' && 'This is the default condition for all products.'}
                                {conditionName === 'Like New' && 'Item has no signs of wear, may include original packaging.'}
                                {conditionName === 'Used' && 'Item shows signs of use, which should be detailed in the description.'}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving || conditionName === 'New'}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
            ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}
