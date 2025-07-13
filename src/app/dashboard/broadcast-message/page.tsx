// src/app/dashboard/broadcast-message/page.tsx
import { ShieldAlert, Announce } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BroadcastForm } from './broadcast-form';
import { getBroadcastMessage } from './actions';

export default async function BroadcastMessagePage() {
  if (mockUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const currentMessage = await getBroadcastMessage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
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
