// src/app/dashboard/broadcast-message/page.tsx
import { ShieldAlert, Announce, Megaphone, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BroadcastForm } from '@/components/dashboard/broadcast-message/broadcast-form';
import { getBroadcastMessage, getCategoriesForBroadcast } from './actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BroadcastMessagePage() {
  const [currentMessage, categories] = await Promise.all([
    getBroadcastMessage(),
    getCategoriesForBroadcast()
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Broadcast Message</CardTitle>
                <CardDescription>
                  Set a sitewide announcement banner for all users.
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <BroadcastForm currentMessage={currentMessage} categories={categories} />
      </CardContent>
    </Card>
  );
}
