// src/app/config-status/page.tsx
import { initializeAdmin } from '@/lib/firebase-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Database, Server } from 'lucide-react';

async function checkFirebaseAdminStatus() {
  try {
    // Attempt to initialize the admin SDK.
    // This function will throw an error if credentials are not set.
    initializeAdmin();
    // If it doesn't throw, the credentials are valid.
    return {
      status: 'success',
      message: 'Successfully connected to Firebase using Admin SDK credentials.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      status: 'error',
      message: errorMessage,
    };
  }
}


export default async function ConfigStatusPage() {
  const adminStatus = await checkFirebaseAdminStatus();

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Server className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Configuration Status</CardTitle>
                <CardDescription>This page checks the server's connection to Firebase.</CardDescription>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <h3 className="font-semibold text-lg">Firebase Admin SDK Status</h3>
            {adminStatus.status === 'success' ? (
                 <div className="flex items-start gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-green-800">Connection Successful</p>
                        <p className="text-sm text-green-700">{adminStatus.message}</p>
                    </div>
                 </div>
            ) : (
                 <div className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-red-800">Connection Failed</p>
                        <p className="text-sm text-red-700">{adminStatus.message}</p>
                        <p className="text-sm text-red-700 mt-2">Please ensure the `.env` file exists at the project root and all `FIREBASE_` variables are set correctly.</p>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
