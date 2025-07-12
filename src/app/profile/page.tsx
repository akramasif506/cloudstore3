
"use client";

import { ProfileForm } from '@/components/profile/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-headline">My Profile</CardTitle>
              <CardDescription>View and edit your personal information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
