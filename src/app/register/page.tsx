
import { RegisterForm } from './register-form';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-10rem)] lg:grid-cols-1">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
           <div className="grid gap-2 text-center">
             <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                <Leaf className="h-8 w-8 text-primary" />
            </div>
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
    </div>
  );
}
