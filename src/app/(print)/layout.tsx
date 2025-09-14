
// src/app/(print)/layout.tsx
import '../globals.css';
import { cn } from '@/lib/utils';
import { Poppins } from 'next/font/google';

// Using a single font for simplicity on the print page
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-body',
});

// This is a new, minimal layout specifically for printing.
// It does not include the main site header, footer, or navigation.
export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <style>
              {`
                  @media print {
                      body {
                          margin: 0;
                          padding: 0;
                          background-color: #fff;
                      }
                      header, footer, .no-print {
                          display: none !important;
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
      <body className={cn('antialiased', poppins.variable)}>
          {children}
      </body>
    </html>
  );
}
