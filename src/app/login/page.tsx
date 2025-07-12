
import { LoginForm } from './login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Leaf } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-2 xl:min-h-[calc(100vh-8rem)]">
      <div className="hidden bg-muted lg:block">
        <div className="relative h-full w-full">
            <Image
                src="https://placehold.co/1200x1200.png"
                alt="A collection of stylish secondhand items"
                fill
                className="object-cover"
                data-ai-hint="lifestyle background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-background/20" />
            <div className="absolute bottom-8 left-8 text-foreground">
                <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="h-8 w-8 text-primary" />
                    <span className="font-bold font-headline text-2xl">CloudStore</span>
                </div>
                <p className="text-lg">Rediscover treasures and give items a new story.</p>
            </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <LoginForm />
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-primary font-semibold">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
