

import { ShieldAlert, MessageSquare, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllMessages } from './actions';
import { RecentMessages } from '@/components/dashboard/recent-messages';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ManageMessagesPage() {
  const messages = await getAllMessages();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Messages</CardTitle>
                <CardDescription>
                  View all messages submitted through the contact form.
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
        <RecentMessages messages={messages} />
      </CardContent>
    </Card>
  );
}
