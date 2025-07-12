
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { CartProvider } from '@/context/cart-context';

// export const metadata: Metadata = {
//   title: 'CloudStore - A Akram Product',
//   description: 'A marketplace for secondhand goods with an AI-powered listing assistant.',
// };

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
           <div className="flex justify-center items-center h-[calc(100vh-16rem)] w-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ReNest - A Secondhand Marketplace</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <AuthProvider>
          <CartProvider>
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
