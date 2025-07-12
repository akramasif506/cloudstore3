
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
import { loginUser } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    const result = await loginUser(values);

    if (result.success && auth?.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        await fetch('/api/auth', {
            method: 'POST',
            headers: {
            'Authorization': `Bearer ${idToken}`,
            },
        });

        toast({
          title: "Login Successful!",
          description: "Welcome back! Redirecting...",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          // A full page refresh is more reliable here to ensure server components re-render
          // with the new session cookie.
          const redirectUrl = searchParams.get('redirect') || '/';
          window.location.href = redirectUrl;
        }
      } catch (e) {
        console.error("Session creation failed", e);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not create a session. Please try again.",
        });
      }

    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: result.error || "Please check your credentials and try again.",
      });
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
        </Button>
      </form>
    </Form>
  );
}
