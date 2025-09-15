

// src/app/my-orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Package, Truck, CheckCircle, Frown, PackageOpen, Home, Phone, User as UserIcon, Calendar, ShoppingCart, Percent, Download, Tag, FileText, MessageSquare } from 'lucide-react';
import { initializeAdmin } from '@/lib/firebase-admin';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';
import { OrderPrintButton } from '@/components/my-orders/order-print-button';


async function getOrder(internalId: string): Promise<Order | null> {
    const { db } = initializeAdmin();
    
    try {
        // Fetch from the denormalized 'all_orders' path for direct lookup
        const orderRef = db.ref(`all_orders/${internalId}`);
        const snapshot = await orderRef.once('value');
        if (snapshot.exists()) {
            return { ...snapshot.val(), internalId: internalId };
        }
        return null;
    } catch (error) {
        console.error("Error fetching order:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const order = await getOrder(params.id);
  const orderIdShort = order?.id;
  
  if (!order) {
    return {
      title: 'Order Not Found',
    }
  }

  return {
    title: `CloudStore Invoice ${orderIdShort}`,
    description: `Details for order ${orderIdShort}, including status, items, and shipping information.`,
  }
}


function StatusIcon({ status }: { status: Order['status'] }) {
    const iconProps = { className: "h-12 w-12" };
    if (status === 'Pending') return <div className="p-4 bg-amber-100 text-amber-800 rounded-full"><PackageOpen {...iconProps} /></div>;
    if (status === 'Shipped') return <div className="p-4 bg-blue-100 text-blue-800 rounded-full"><Truck {...iconProps} /></div>;
    if (status === 'Delivered') return <div className="p-4 bg-green-100 text-green-800 rounded-full"><CheckCircle {...iconProps} /></div>;
    if (status === 'Cancelled') return <div className="p-4 bg-red-100 text-red-800 rounded-full"><Frown {...iconProps} /></div>;
    return <div className="p-4 bg-muted text-muted-foreground rounded-full"><Package {...iconProps} /></div>;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const order = await getOrder(params.id);

    if (!order) {
        notFound();
    }
    
    // Set default values for fee fields if they don't exist
    const subtotal = order.subtotal ?? order.total;
    const platformFee = order.platformFee ?? 0;
    const handlingFee = order.handlingFee ?? 0;
    const tax = order.tax ?? 0;
    const discountValue = order.discount?.value ?? 0;
    const total = order.total;


    return (
        <div className="max-w-4xl mx-auto" id="invoice-content">
            <Card>
                <CardHeader className="text-center bg-muted/30 p-6 print:p-2 print:py-4">
                    <div className="flex justify-between items-center mb-4 print:mb-2">
                        <Image src={`/logo.png?v=${new Date().getTime()}`} alt="CloudStore Logo" width={120} height={30} className="object-contain" />
                        <div className="text-right">
                           <CardTitle className="text-3xl font-bold mt-4 print:text-xl print:mt-0">Order Status: {order.status}</CardTitle>
                           <CardDescription>Order #{order.id}</CardDescription>
                        </div>
                    </div>
                    <div className="mx-auto print:hidden">
                        <StatusIcon status={order.status} />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {order.comments && (
                        <>
                        <div className="mb-6">
                             <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><MessageSquare className="h-5 w-5" />Order Comments</h3>
                             <p className="text-muted-foreground bg-muted/50 p-3 rounded-md border text-sm">{order.comments}</p>
                        </div>
                         <Separator className="my-8" />
                        </>
                    )}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Home className="h-5 w-5" />Shipping Details</h3>
                            <div className="text-muted-foreground space-y-2">
                                <p className="flex items-start gap-3"><UserIcon className="h-4 w-4 mt-1 flex-shrink-0" /><span className="font-semibold text-foreground">{order.customerName}</span></p>
                                <p className="flex items-start gap-3"><Home className="h-4 w-4 mt-1 flex-shrink-0" /><span>{order.shippingAddress}</span></p>
                                <p className="flex items-start gap-3"><Phone className="h-4 w-4 mt-1 flex-shrink-0" /><span>{order.contactNumber}</span></p>
                                <p className="flex items-start gap-3"><Calendar className="h-4 w-4 mt-1 flex-shrink-0" /><span>Placed on {new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                             <div className="space-y-2 text-muted-foreground">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">Rs {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1"><Percent className="h-3 w-3" /> Platform Fee</span>
                                    <span className="font-medium">Rs {platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Handling Fee</span>
                                    <span className="font-medium">Rs {handlingFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> GST / Tax</span>
                                    <span className="font-medium">Rs {tax.toFixed(2)}</span>
                                </div>
                                {order.discount && (
                                  <div className="flex justify-between text-sm text-green-600">
                                    <span className="font-medium flex items-center gap-1"><Tag className="h-3 w-3" /> {order.discount.name}</span>
                                    <span className="font-medium">- Rs {discountValue.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                    <span className="font-medium text-destructive">Free</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg text-foreground">
                                    <span>Total</span>
                                    <span>Rs {total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Separator className="my-8" />
                    
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Items in your order</h3>
                        <div className="space-y-4">
                            {order.items.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right font-medium">
                                        <p>Rs {(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">(Rs {item.price.toFixed(2)} each)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="bg-muted/30 p-6 flex justify-center gap-4 print:hidden">
                    <Button asChild>
                        <Link href="/">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Continue Shopping
                        </Link>
                    </Button>
                    <OrderPrintButton order={order} />
                </CardFooter>
            </Card>
        </div>
    );
}
