
// src/components/layout/broadcast-banner.tsx
"use client";

import { useEffect, useState } from 'react';
import { getBroadcastMessage } from '@/app/dashboard/broadcast-message/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, X } from 'lucide-react';
import Link from 'next/link';

type BroadcastMessage = {
  id: number;
  message: string;
  link: string | null;
};

const DISMISSED_KEY = 'dismissedBroadcastId';

export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function fetchMessage() {
      try {
        const data = await getBroadcastMessage();
        if (data && data.message) {
          const dismissedId = sessionStorage.getItem(DISMISSED_KEY);
          // Show if there is a message AND its ID is not the one we dismissed.
          if (String(data.id) !== dismissedId) {
            setBroadcast(data);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch broadcast message:", error);
      }
    }
    fetchMessage();
  }, []);

  const handleDismiss = () => {
    if (!broadcast) return;
    setIsVisible(false);
    // Remember the ID of the dismissed message for the current browser session
    sessionStorage.setItem(DISMISSED_KEY, String(broadcast.id));
  };

  if (!broadcast || !isVisible) {
    return null;
  }

  const BannerContent = (
    <Alert className="relative rounded-none border-x-0 border-t-0 bg-primary/10 text-primary-foreground pr-10">
      <Megaphone className="h-4 w-4 text-primary" />
      <AlertDescription className="font-semibold text-primary">
        {broadcast.message}
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary/70 hover:text-primary"
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
