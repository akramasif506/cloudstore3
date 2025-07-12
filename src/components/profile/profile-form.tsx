
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { Loader2, Frown } from 'lucide-react';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { updateUserProfile } from '@/app/profile/actions';

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  mobileNumber: z.string().regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.enum(['male', 'female', 'other']),
});

export function ProfileForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      gender: undefined,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        gender: user.gender,
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsSubmitting(true);

    const result = await updateUserProfile({
        userId: user.id,
        name: values.name,
        mobileNumber: values.mobileNumber,
    });
    
    setIsSubmitting(false);

    if (result.success) {
        toast({
            title: "Profile Updated!",
            description: "Your information has been saved successfully.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.message || "Could not save your profile. Please try again.",
        });
    }
  }
  
  if (!user) {
    return (
       <Card className="flex flex-col items-center justify-center text-center py-20 border-none shadow-none">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
            <Frown className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>You're Not Logged In</CardTitle>
          <CardDescription>You must be logged in to view your profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login?redirect=/profile')}>
            Go to Login Page
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormItem>
            <FormLabel>Profile Picture</FormLabel>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profileImageUrl} alt={user.name || 'User Avatar'} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </div>
            <FormDescription>
                Profile pictures are automatically assigned.
            </FormDescription>
        </FormItem>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} readOnly disabled />
              </FormControl>
               <FormDescription>Your email address cannot be changed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="9876543210" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex items-center space-x-6"
                  disabled
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="male" />
                    </FormControl>
                    <FormLabel className="font-normal">Male</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="female" />
                    </FormControl>
                    <FormLabel className="font-normal">Female</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="other" />
                    </FormControl>
                    <FormLabel className="font-normal">Other</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
               <FormDescription>Your gender cannot be changed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </form>
    </Form>
  );
}
