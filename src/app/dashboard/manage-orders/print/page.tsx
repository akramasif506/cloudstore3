
import { notFound } from 'next/navigation';
import type { Order } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { InvoicePage } from './invoice-page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

async function getOrders(internalIds: string[]): Promise<Order[]> {
    if (!internalIds || internalIds.length === 0) {
        return [];
    }

    let db;
    try {
        ({ db } = initializeAdmin());
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
        return [];
    }
    
    try {
        const orderPromises = internalIds.map(id => {
            const orderRef = db.ref(`all_orders/${id}`);
            return orderRef.once('value');
        });
        
        const snapshots = await Promise.all(orderPromises);
        
        const orders = snapshots.map((snapshot, index) => {
             if (snapshot.exists()) {
                return { ...snapshot.val(), internalId: internalIds[index] };
             }
             return null;
        }).filter((order): order is Order => order !== null);

        return orders;

    } catch (error) {
        console.error("Error fetching multiple orders:", error);
        return [];
    }
}


export default async function PrintOrdersPage({
  searchParams
}: {
  searchParams?: {
    orders?: string;
  };
}) {
    const orderIds = searchParams?.orders?.split(',');

    if (!orderIds || orderIds.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-muted">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle>No Orders Selected</CardTitle>
                        <CardDescription>No order IDs were provided. Please go back and select orders to print.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    const orders = await getOrders(orderIds);

    if (orders.length === 0) {
        notFound();
    }
    
    return <InvoicePage orders={orders} />;
}
