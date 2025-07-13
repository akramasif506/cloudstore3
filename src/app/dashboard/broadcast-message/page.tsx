
// src/app/dashboard/broadcast-message/page.tsx
import { ShieldAlert, Announce, Megaphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BroadcastForm } from './broadcast-form';
import { getBroadcastMessage } from './actions';

export default async function BroadcastMessagePage() {
  const currentMessage = await getBroadcastMessage();

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <BroadcastForm currentMessage={currentMessage} />
      </CardContent>
    </Card>
  );
}
