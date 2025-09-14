
import { Percent, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeeConfig } from './actions';
import { FeeForm } from '@/components/dashboard/manage-fees/fee-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ManageFeesPage() {
  const currentFees = await getFeeConfig();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Fees & Taxes</CardTitle>
                <CardDescription>
                  Set store-wide fees that will be applied to all orders at checkout.
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
        <FeeForm currentFees={currentFees} />
      </CardContent>
    </Card>
  );
}
