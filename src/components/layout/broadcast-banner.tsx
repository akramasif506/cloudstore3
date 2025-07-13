// src/components/layout/broadcast-banner.tsx
"use client";

import { useEffect, useState } from 'react';
import { getBroadcastMessage } from '@/app/dashboard/broadcast-message/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone, X } from 'lucide-react';
import Link from 'next/link';

type BroadcastMessage = {
  message: string;
  link: string | null;
};

export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the banner has been dismissed during this session
    const dismissed = sessionStorage.getItem('broadcastDismissed');
    if (dismissed) {
      return;
    }

    async function fetchMessage() {
      try {
        const data = await getBroadcastMessage();
        if (data && data.message) {
          setBroadcast(data);
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Failed to fetch broadcast message:", error);
      }
    }
    fetchMessage();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for the current browser session
    sessionStorage.setItem('broadcastDismissed', 'true');
  };

  if (!broadcast || !isVisible) {
    return null;
  }

  const BannerContent = (
    <Alert className="relative rounded-none border-x-0 border-t-0 bg-accent text-accent-foreground pr-10">
      <Megaphone className="h-4 w-4" />
      <AlertDescription className="font-semibold">
        {broadcast.message}
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-accent-foreground/70 hover:text-accent-foreground"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );

  if (broadcast.link) {
    return (
      <Link href={broadcast.link} target="_blank" rel="noopener noreferrer">
        {BannerContent}
      </Link>
    );
  }

  return BannerContent;
}
