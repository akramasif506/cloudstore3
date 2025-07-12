
// src/app/my-orders/my-orders-client.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PackageOpen, CheckCircle, Truck, Frown, Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, query, get, orderByChild, equalTo } from 'firebase/database';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

async function getMyOrders(userId: string): Promise<Order[]> {
    if (!db || !userId) {
        return [];
    }

    try {
        const ordersRef = ref(db, 'orders');
        const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
        const snapshot = await get(userOrdersQuery);

        if (snapshot.exists()) {
            const ordersData = snapshot.val();
            return Object.keys(ordersData)
                .map(key => ({ ...ordersData[key], id: key }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
        }
        return [];
    } catch (error) {
        console.error("Error fetching user orders from Firebase:", error);
        return [];
    }
}

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


export function MyOrdersClient() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            getMyOrders(user.id)
                .then(setOrders)
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setOrders([]);
            setLoading(false);
        }
    }, [user]);

    if (loading) {
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
                    <CardTitle className="flex items-center gap-2"><Frown /> You're Not Logged In</CardTitle>
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
                        <Card key={order.id} className="hover:shadow-md transition-shadow">
                             <Link href={`/my-orders/${order.id}`} className="block">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">Order #{order.id.substring(0, 8).toUpperCase()}</CardTitle>
                                            <CardDescription>Placed on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{order.items.length} item(s)</p>
                                        </div>
                                        <p className="text-xl font-bold">Total: Rs {order.total.toFixed(2)}</p>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
