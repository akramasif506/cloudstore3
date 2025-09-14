
"use client";

import type { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Package, Truck, CheckCircle, Frown, PackageOpen, Home, Phone, User as UserIcon, Calendar, ShoppingCart, Percent, Tag, FileText } from 'lucide-react';
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

function Invoice({ order }: { order: Order }) {
    const subtotal = order.subtotal ?? 0;
    const platformFee = order.platformFee ?? 0;
    const handlingFee = order.handlingFee ?? 0;
    const tax = order.tax ?? 0;
    const discountValue = order.discount?.value ?? 0;
    const total = order.total;

    return (
        <div className="p-8 print-page-break">
            <Card className="w-full mx-auto border-2 border-primary shadow-2xl">
                 <CardHeader className="text-center bg-muted/30 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <Image src={`/logo.png`} alt="CloudStore Logo" width={120} height={30} className="object-contain" />
                        <div className="text-right">
                           <CardTitle className="text-2xl font-bold mt-4">Order Status: {order.status}</CardTitle>
                           <CardDescription>Order #{order.id}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
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
                                    <span className="font-medium text-primary">Free</span>
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
            </Card>
        </div>
    );
}

export function InvoicePage({ orders }: { orders: Order[] }) {
    useEffect(() => {
        // Automatically trigger the print dialog once the component mounts
        setTimeout(() => {
            window.print();
        }, 1000); // Delay to ensure content loads
    }, []);

    return (
        <div className="bg-muted">
            <div className="fixed top-4 right-4 no-print">
                <Button onClick={() => window.print()}>Print Again</Button>
            </div>
            {orders.map(order => <Invoice key={order.internalId} order={order} />)}
        </div>
    );
}
