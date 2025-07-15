
"use client";

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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const testSchema = z.object({
  testField: z.string().min(2, 'This field is required.'),
});

export default function TestFormPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testField: '',
    },
  });

  function onSubmit(values: z.infer<typeof testSchema>) {
    toast({
      title: "Test Successful!",
      description: `You submitted: ${values.testField}`,
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Form</CardTitle>
          <CardDescription>
            This is a minimal form to test component rendering.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="testField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Field</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter some text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit Test</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
