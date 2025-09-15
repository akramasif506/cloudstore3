
import { Store, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSellerSettings } from './actions';
import { SellerSettingsForm } from './seller-settings-form';
import { initializeAdmin } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

// New function to get details for only the allowed users
async function getAllowedUsers(allowedSellersMap: { [userId: string]: boolean }): Promise<User[]> {
    if (!allowedSellersMap || Object.keys(allowedSellersMap).length === 0) {
        return [];
    }

    const { db } = initializeAdmin();
    const userIds = Object.keys(allowedSellersMap);

    const userPromises = userIds.map(async (id) => {
        const userRef = db.ref(`users/${id}`);
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
            return { id, ...snapshot.val() };
        }
        return null;
    });

    const users = (await Promise.all(userPromises)).filter((u): u is User => u !== null);
    return users;
}


export default async function SellerSettingsPage() {
  const settings = await getSellerSettings();
  const initialAllowedUsers = await getAllowedUsers(settings.allowed_sellers);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Seller Settings</CardTitle>
                <CardDescription>
                  Control who is allowed to sell items on your marketplace.
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
        <SellerSettingsForm 
            initialSettings={settings}
            initialAllowedUsers={initialAllowedUsers}
        />
      </CardContent>
    </Card>
  );
}
