
// src/app/test-sell/page.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testSession } from './actions';
import { Loader2, Server, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function TestSellPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const { user, loading: authLoading } = useAuth();

  const handleTestClick = async () => {
    setIsLoading(true);
    setResult(null);
    const response = await testSession();
    setResult(response);
    setIsLoading(false);
  };

  const ResultDisplay = () => {
    if (!result) return null;

    if (result.success) {
      return (
        <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-bold">{result.message}</p>
              <p className="text-sm">User ID: {result.data.uid}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-bold">Test Failed</p>
            <p className="text-sm">{result.message}</p>
            {result.data?.error && <p className="text-xs mt-2">Details: {result.data.error}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Session Cookie Test</CardTitle>
              <CardDescription>
                This page tests if the server can verify your login session from a Server Action.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 border-dashed border-2 rounded-lg text-center">
            <p className="font-semibold mb-1">Current Login Status (Client-side):</p>
            {authLoading ? (
               <div className="flex items-center justify-center gap-2 text-muted-foreground">
                 <Loader2 className="h-4 w-4 animate-spin" />
                 <span>Checking...</span>
               </div>
            ) : user ? (
              <p className="text-green-600 font-medium">Logged In as {user.email}</p>
            ) : (
              <p className="text-red-600 font-medium">Not Logged In</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">Click the button below to ask the server to verify your session cookie.</p>
            <Button onClick={handleTestClick} disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Server className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Testing...' : 'Test Server Session'}
            </Button>
          </div>
          <ResultDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
