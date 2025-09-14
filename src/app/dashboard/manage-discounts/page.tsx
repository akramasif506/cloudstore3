
import { MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDiscounts } from './actions';
import { DiscountForm } from '@/components/dashboard/manage-discounts/discount-form';

export default async function ManageDiscountsPage() {
  const discounts = await getDiscounts();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Location-Based Discounts</CardTitle>
                <CardDescription>
                  Create and manage discount rules based on customer PIN codes.
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
        <DiscountForm initialDiscounts={discounts} />
      </CardContent>
    </Card>
  );
}
