
import { Undo2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getReturnPolicy } from './actions';
import { ReturnPolicyForm } from './return-policy-form';

export default async function ManageReturnPolicyPage() {
  const policy = await getReturnPolicy();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Undo2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Return Policy</CardTitle>
                <CardDescription>
                  Define the terms and conditions for product returns.
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
        <ReturnPolicyForm currentPolicy={policy} />
      </CardContent>
    </Card>
  );
}
