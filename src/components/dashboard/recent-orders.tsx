
// src/components/dashboard/recent-orders.tsx
import type { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';
import { initializeAdmin } from '@/lib/firebase-admin';

async function getRecentOrders(): Promise<Order[]> {
    let db;
    try {
      ({ db } = initializeAdmin());
    } catch (error) {
      console.error("Firebase Admin SDK init error:", error);
      return [];
    }

    try {
        const ordersRef = db.ref('orders');
        const recentOrdersQuery = ordersRef.orderByKey().limitToLast(5);
        const snapshot = await recentOrdersQuery.once('value');
        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersList = Object.keys(ordersData).map(key => ({
                ...ordersData[key],
                id: key,
            }));
            return ordersList.reverse(); // Show newest first
        }
        return [];
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return [];
    }
}

export async function RecentOrders() {
  const orders = await getRecentOrders();
  
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No orders have been placed yet.</p>
  }

  return (
    <div className="border rounded-lg">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                        <TableCell><Badge variant={order.status === 'Pending' ? 'secondary' : 'default'}>{order.status}</Badge></TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">Rs {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
