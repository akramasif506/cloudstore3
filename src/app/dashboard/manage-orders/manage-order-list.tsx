
"use client";

import { useState } from 'react';
import type { Order } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatus } from './actions';
import { CheckCircle, MoreHorizontal, Loader2, PackageOpen, Truck, Frown, Eye } from 'lucide-react';
import Link from 'next/link';

interface ManageOrderListProps {
  initialOrders: Order[];
}

const statusOptions: Order['status'][] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const statusStyles = {
    Pending: 'bg-amber-100 text-amber-800',
    Shipped: 'bg-blue-100 text-blue-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
};
const statusIcons = {
    Pending: <PackageOpen className="h-4 w-4" />,
    Shipped: <Truck className="h-4 w-4" />,
    Delivered: <CheckCircle className="h-4 w-4" />,
    Cancelled: <Frown className="h-4 w-4" />,
};

export function ManageOrderList({ initialOrders }: ManageOrderListProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatusId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    setUpdatingStatusId(null);

    if (result.success) {
      setOrders(currentOrders =>
        currentOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast({
        title: "Order Status Updated",
        description: `Order #${orderId.substring(0,8)} is now ${newStatus}.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message || "Could not update the order status.",
      });
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">No Orders Found</h3>
        <p>There are currently no orders to manage.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>{order.contactNumber}</TableCell>
              <TableCell>Rs {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}</TableCell>
              <TableCell>
                 <Badge variant="secondary" className={`capitalize ${statusStyles[order.status]}`}>
                    <div className="flex items-center gap-2">
                        {statusIcons[order.status]}
                        {order.status}
                    </div>
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {updatingStatusId === order.id ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="ghost">
                        <Link href={`/my-orders/${order.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {statusOptions.map(status => (
                          <DropdownMenuItem
                            key={status}
                            disabled={order.status === status}
                            onClick={() => handleStatusChange(order.id, status)}
                          >
                            Mark as {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
