

import { ShieldAlert, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllOrders } from './actions';
import { ManageOrderList } from './manage-order-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ManageOrdersPage() {
  const orders = await getAllOrders();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Orders</CardTitle>
                <CardDescription>View all orders and update their fulfillment status.</CardDescription>
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
        <ManageOrderList initialOrders={orders} />
      </CardContent>
    </Card>
  );
}
