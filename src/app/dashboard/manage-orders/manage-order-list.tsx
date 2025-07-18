
"use client";

import { useState } from 'react';
import type { Order, OrderItem } from '@/lib/types';
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
import { CheckCircle, MoreHorizontal, Loader2, PackageOpen, Truck, Frown, Eye, ChevronDown, ChevronRight, User, Phone, Undo2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

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

function OrderRow({ order: initialOrder }: { order: Order }) {
    const [order, setOrder] = useState(initialOrder);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const { toast } = useToast();

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        setUpdatingStatusId(orderId);
        const result = await updateOrderStatus(orderId, newStatus);
        setUpdatingStatusId(null);

        if (result.success) {
            setOrder(o => ({ ...o, status: newStatus }));
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
    
    return (
        <Collapsible asChild>
            <tbody data-state={isExpanded ? 'open' : 'closed'}>
                <TableRow className="bg-background hover:bg-muted/50">
                    <TableCell>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <span className="sr-only">Toggle details</span>
                            </Button>
                        </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
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
                <CollapsibleContent asChild>
                    <TableRow>
                        <TableCell colSpan={7} className="p-0">
                           <div className="p-4 bg-muted space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div>
                                       <h4 className="font-semibold mb-2">Items</h4>
                                       <div className="space-y-3">
                                        {order.items.map((item: OrderItem) => (
                                            <div key={item.id} className="flex justify-between items-center bg-background p-3 rounded-md">
                                                <div className="flex items-center gap-4">
                                                    <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover h-12 w-12"/>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>{item.seller?.name || 'Unknown Seller'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{item.seller?.contactNumber || 'No contact'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                       </div>
                                   </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Return Information</h4>
                                        <div className="bg-background p-3 rounded-md text-sm">
                                            <p className="text-muted-foreground">
                                                This section is for managing customer returns. The functionality is under development.
                                            </p>
                                            <Separator className="my-3"/>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Status: Not Requested</span>
                                                <Button size="sm" variant="outline" disabled>
                                                    <Undo2 className="mr-2 h-4 w-4"/>
                                                    Process Return
                                                </Button>
                                            </div>
                                        </div>
                                   </div>
                               </div>
                           </div>
                        </TableCell>
                    </TableRow>
                </CollapsibleContent>
            </tbody>
        </Collapsible>
    )
}


export function ManageOrderList({ initialOrders }: ManageOrderListProps) {

  if (initialOrders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">No Orders Found</h3>
        <p>There are currently no orders to manage.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        {initialOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
        ))}
      </Table>
    </div>
  );
}
