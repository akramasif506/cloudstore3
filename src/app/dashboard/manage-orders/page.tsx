

import { ShieldAlert, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllOrders } from './actions';
import { ManageOrderList } from './manage-order-list';
import { getCurrentUser } from '@/lib/auth';

export default async function ManageOrdersPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold font-headline">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const orders = await getAllOrders();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline">Manage Orders</CardTitle>
            <CardDescription>View all orders and update their fulfillment status.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ManageOrderList initialOrders={orders} />
      </CardContent>
    </Card>
  );
}
