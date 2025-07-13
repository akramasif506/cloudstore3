// src/app/listings/[id]/share-buttons.tsx
"use client";

import { useState } from 'react';
import copy from 'copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Link as LinkIcon, Check, Twitter, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  productName: string;
  productUrl: string;
}

// A simple SVG for WhatsApp since it's not in Lucide
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);


export function ShareButtons({ productName, productUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    copy(productUrl);
    setCopied(true);
    toast({
      title: 'Link Copied!',
      description: 'The product link is now in your clipboard.',
    });
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };
  
  const shareText = `Check out this listing on CloudStore: ${productName}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${productUrl}`)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share this Item
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? <Check className="text-green-500" /> : <LinkIcon />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>
            <Button asChild variant="outline" size="icon" aria-label="Share on Twitter">
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                    <Twitter />
                </a>
            </Button>
             <Button asChild variant="outline" size="icon" aria-label="Share on WhatsApp">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon />
                </a>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
