
// src/app/(print)/dashboard/manage-orders/print/page.tsx
import { notFound } from 'next/navigation';
import type { Order } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { InvoicePage } from './invoice-page';

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
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">No orders selected.</h1>
                    <p className="text-muted-foreground">Please go back and select orders to print.</p>
                </div>
            </div>
        );
    }
    
    const orders = await getOrders(orderIds);

    if (orders.length === 0) {
        notFound();
    }
    
    return <InvoicePage orders={orders} />;
}
