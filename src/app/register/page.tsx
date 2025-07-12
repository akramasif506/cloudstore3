
import { RegisterForm } from './register-form';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-10rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold font-headline">Create an account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to get started
            </p>
          </div>
          <RegisterForm />
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary font-semibold">
              Log in
            </Link>
          </div>
        </div>
      </div>
       <div className="hidden bg-muted lg:block">
        <div className="relative h-full w-full">
            <Image
                src="https://placehold.co/1200x1200.png"
                alt="A collection of stylish secondhand items"
                fill
                className="object-cover"
                data-ai-hint="lifestyle products"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-background/20" />
            <div className="absolute bottom-8 left-8 text-foreground">
                <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="h-8 w-8 text-primary" />
                    <span className="font-bold font-headline text-2xl">CloudStore</span>
                </div>
                <p className="text-lg">Join our community of buyers and sellers today.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
