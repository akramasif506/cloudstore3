
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { testUpload } from './actions';

const testSchema = z.object({
  testField: z.string().min(2, 'This field is required.'),
  imageFile: z.any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export default function TestFormPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testField: '',
      imageFile: undefined,
    },
  });

  const imageRef = form.register("imageFile");

  async function onSubmit(values: z.infer<typeof testSchema>) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('testField', values.testField);
    formData.append('imageFile', values.imageFile[0]);

    const result = await testUpload(formData);

    if (result.success) {
        toast({
            title: "Upload Successful!",
            description: result.message,
        });
        form.reset();
    } else {
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: result.message,
        });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Test Form</CardTitle>
          <CardDescription>
            This form tests real file uploads to Firebase Storage.
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

              <FormField
                control={form.control}
                name="imageFile"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" {...imageRef} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
               />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit & Upload
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
