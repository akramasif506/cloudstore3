
import { Toaster } from "@/components/ui/toaster"
import { Playfair_Display, Poppins } from 'next/font/google';
import { cn } from "@/lib/utils";
import '@/app/globals.css';

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

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Print Invoices</title>
         <style>
          {`
            @media print {
                .no-print {
                    display: none !important;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #fff;
                }
                .print-page-break {
                    page-break-after: always;
                }
                .print-page-break:last-child {
                    page-break-after: auto;
                }
                @page {
                    size: A4;
                    margin: 0;
                }
            }
          `}
        </style>
      </head>
      <body className={cn('antialiased', playfair.variable, poppins.variable)}>
          {children}
          <Toaster />
      </body>
    </html>
  );
}
