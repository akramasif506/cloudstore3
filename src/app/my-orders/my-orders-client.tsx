
// src/app/my-orders/my-orders-client.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PackageOpen, CheckCircle, Truck, Frown, Loader2, Undo2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getMyOrders } from './actions';
import { getReturnPolicy } from '../dashboard/manage-returns/actions';
import type { ReturnPolicy } from '../dashboard/manage-returns/actions';
import { useToast } from '@/hooks/use-toast';

function StatusBadge({ status }: { status: Order['status'] }) {
    const baseClasses = "flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full w-fit";
    if (status === 'Pending') {
        return <div className={`${baseClasses} bg-amber-100 text-amber-800`}><PackageOpen className="h-4 w-4" />Pending</div>;
    }
    if (status === 'Shipped') {
        return <div className={`${baseClasses} bg-blue-100 text-blue-800`}><Truck className="h-4 w-4" />Shipped</div>;
    }
    if (status === 'Delivered') {
        return <div className={`${baseClasses} bg-green-100 text-green-800`}><CheckCircle className="h-4 w-4" />Delivered</div>;
    }
    if (status === 'Cancelled') {
        return <div className={`${baseClasses} bg-red-100 text-red-800`}><Frown className="h-4 w-4" />Cancelled</div>;
    }
    return null;
}

function isReturnable(order: Order, policy: ReturnPolicy): boolean {
    if (!policy.isEnabled || order.status !== 'Delivered') {
        return false;
    }
    // A return window of 0 means returns are always allowed for delivered items.
    if (policy.returnWindowDays === 0) {
        return true;
    }
    // TODO: This assumes the `createdAt` timestamp is close to the delivery date.
    // For a more accurate implementation, a `deliveredAt` timestamp would be needed.
    const orderDate = new Date(order.createdAt);
    const returnDeadline = new Date(orderDate);
    returnDeadline.setDate(orderDate.getDate() + policy.returnWindowDays);
    
    return new Date() <= returnDeadline;
}

export function MyOrdersClient() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [returnPolicy, setReturnPolicy] = useState<ReturnPolicy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            if (user) {
                setIsLoading(true);
                try {
                    const [userOrders, policy] = await Promise.all([
                        getMyOrders(),
                        getReturnPolicy()
                    ]);
                    setOrders(userOrders);
                    setReturnPolicy(policy);
                } catch (error) {
                     console.error("Failed to fetch data:", error);
                     setOrders([]);
                     setReturnPolicy(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setOrders([]);
                setIsLoading(false);
            }
        }
        loadData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <Card className="flex flex-col items-center justify-center text-center py-20">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                        <Frown className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>You're Not Logged In</CardTitle>
                    <CardDescription>You must be logged in to view your orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/login?redirect=/my-orders')}>
                        Go to Login
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-headline">My Orders</h1>
                        <p className="text-muted-foreground">View your purchase history.</p>
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                 <Card className="flex flex-col items-center justify-center text-center py-20">
                    <CardHeader>
                        <CardTitle>No Orders Yet</CardTitle>
                        <CardDescription>You haven't made any purchases.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Button asChild>
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <Card key={order.id} className="transition-shadow hover:shadow-md">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Link href={`/my-orders/${order.id}`} className="block">
                                        <CardTitle className="text-lg">Order #{order.id.substring(0, 8).toUpperCase()}</CardTitle>
                                        <CardDescription>Placed on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                    </Link>
                                    <StatusBadge status={order.status} />
                                </div>
                            </CardHeader>
                             <CardContent>
                                <div className="flex justify-between items-end">
                                    <p className="text-xl font-bold">Total: Rs {order.total.toFixed(2)}</p>
                                    <Link href={`/my-orders/${order.id}`} className="text-sm text-primary hover:underline">View Details</Link>
                                </div>
                            </CardContent>
                             {returnPolicy && isReturnable(order, returnPolicy) && (
                                <CardFooter className="bg-muted/30">
                                    <Button
                                        variant="outline"
                                        onClick={() => toast({ title: "Feature Coming Soon!", description: "The ability to request returns is currently under development."})}
                                        disabled
                                    >
                                        <Undo2 className="mr-2 h-4 w-4" />
                                        Request Return
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
