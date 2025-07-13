

import { ShieldAlert, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllMessages } from './actions';
import { RecentMessages } from '@/components/dashboard/recent-messages';

export default async function ManageMessagesPage() {
  const messages = await getAllMessages();

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <RecentMessages messages={messages} />
      </CardContent>
    </Card>
  );
}
