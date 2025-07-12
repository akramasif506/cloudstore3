
// src/app/test-user/test-user-client.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, ShieldAlert, UserCheck } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { LoginForm } from '@/app/login/login-form';

interface TestUserClientProps {
    user: FirebaseUser | null;
    profileResult: {
        success: boolean;
        message: string;
        data: any;
    } | null;
}

export function TestUserClient({ user, profileResult }: TestUserClientProps) {
    const handleLoginSuccess = () => {
        // Refresh the page to re-run server components and get new data
        window.location.reload();
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                            <Beaker className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-headline">User Fetch Test</CardTitle>
                            <CardDescription>This page tests if user details can be fetched from the database.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">1. Firebase Auth Status</h3>
                        {user ? (
                            <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800 flex items-center gap-3">
                                <UserCheck className="h-5 w-5" />
                                <div>
                                    <p className="font-semibold">Success: User is logged in.</p>
                                    <p className="text-sm">User ID: {user.uid}</p>
                                    <p className="text-sm">Email: {user.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                                <p className="font-semibold mb-2 flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Status: No user is currently logged in.</p>
                                <p className="text-sm font-semibold mb-2">Use the form below to log in.</p>
                                <div className="p-4 mt-4 bg-white rounded-md border">
                                     <LoginForm onSuccess={handleLoginSuccess} />
                                </div>
                            </div>
                        )}
                    </div>
                    {user && (
                        <div>
                            <h3 className="font-semibold mb-2">2. Firebase Realtime Database Fetch</h3>
                            {profileResult?.success ? (
                                <div className="p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
                                    <p className="font-semibold mb-2 flex items-center gap-2"><UserCheck className="h-5 w-5" /> {profileResult.message}</p>
                                    <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded">{JSON.stringify(profileResult.data, null, 2)}</pre>
                                </div>
                            ) : (
                                <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
                                    <p className="font-semibold mb-2 flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Fetch Failed</p>
                                    <p className="text-sm">{profileResult?.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
