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
    const admin = initializeAdmin();
    if (!admin) return [];
    
    const { db } = admin;

    try {
        // Fetch from the denormalized global list for recent orders
        const ordersRef = db.ref('all_orders');
        const snapshot = await ordersRef.once('value');

        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            const ordersList = Object.keys(ordersData).map(key => ({
                ...ordersData[key],
                internalId: key, // Use internalId for links, keep `id` for display
            }));
            // Sort all orders by date and take the most recent 5
            return ordersList
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5);
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
                    <TableRow key={order.internalId}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
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
