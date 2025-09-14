
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
import { BroadcastBanner } from '@/components/layout/broadcast-banner';
import { Playfair_Display, Poppins } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-headline',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-body',
})

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-background z-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <BroadcastBanner />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
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
        <title>CloudStore - A Secondhand Marketplace</title>
      </head>
      <body className={cn('antialiased min-h-screen flex flex-col', playfair.variable, poppins.variable)}>
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
