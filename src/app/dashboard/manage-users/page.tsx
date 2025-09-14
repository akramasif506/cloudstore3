
import { Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAllUsers } from './actions';
import { UserList } from '@/components/dashboard/manage-users/user-list';
import { Suspense } from 'react';

// Let's keep this dynamic to ensure fresh data on first load.
// The refresh button will handle subsequent updates.
export const dynamic = 'force-dynamic';

export default async function ManageUsersPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
  };
}) {
  const users = await getAllUsers(searchParams?.q);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Users</CardTitle>
                <CardDescription>
                  View all registered users and manage their roles.
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
        <Suspense fallback={<p>Loading users...</p>}>
          <UserList initialUsers={users} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
