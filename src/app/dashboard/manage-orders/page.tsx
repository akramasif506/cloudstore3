

import { ShieldAlert, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllOrders } from './actions';
import { ManageOrderList } from './manage-order-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OrderFilters } from './order-filters';
import type { Order } from '@/lib/types';
import { DownloadReportButton } from './download-report-button';
import { Suspense } from 'react';

export default async function ManageOrdersPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    status?: Order['status'];
    from?: string;
    to?: string;
  };
}) {
  const orders = await getAllOrders(searchParams);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">Manage Orders</CardTitle>
                <CardDescription>View all orders and update their fulfillment status.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
                <DownloadReportButton allOrders={orders} />
                <Button asChild variant="outline">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         <Suspense fallback={null}>
          <OrderFilters />
        </Suspense>
        <div className="mt-8">
            <ManageOrderList initialOrders={orders} />
        </div>
      </CardContent>
    </Card>
  );
}
