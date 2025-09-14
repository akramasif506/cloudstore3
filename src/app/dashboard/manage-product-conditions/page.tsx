
import { Wrench, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getProductConditions } from './actions';
import { ConditionForm } from '@/components/dashboard/manage-product-conditions/condition-form';

export default async function ManageProductConditionsPage() {
  const conditions = await getProductConditions();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Product Conditions</CardTitle>
                <CardDescription>
                  Enable or disable the product conditions available for sellers to choose.
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
        <ConditionForm initialConditions={conditions} />
      </CardContent>
    </Card>
  );
}
