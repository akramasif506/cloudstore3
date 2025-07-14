
import { Percent } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFeeConfig } from './actions';
import { FeeForm } from './fee-form';

export default async function ManageFeesPage() {
  const currentFees = await getFeeConfig();

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <FeeForm currentFees={currentFees} />
      </CardContent>
    </Card>
  );
}
