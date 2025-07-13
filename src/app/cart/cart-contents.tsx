
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Frown, Home, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { placeOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function CartContents() {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      setAddress(user.address || '');
      setContactNumber(user.mobileNumber || '');
    }
  }, [user]);

  const isOrderReady = address.trim() !== '' && contactNumber.trim() !== '' && user;

  const handlePlaceOrder = async () => {
    if (!isOrderReady) {
        toast({
            variant: "destructive",
            title: "Cannot place order",
            description: "Please log in and fill in all shipping information.",
        });
        return;
    }

    setIsPlacingOrder(true);
    const result = await placeOrder({
        userId: user.id,
        customerName: user.name || 'Valued Customer',
        items,
        total: subtotal,
        shippingAddress: address,
        contactNumber,
    });
    setIsPlacingOrder(false);

    if (result.success && result.orderId) {
        toast({
            title: "Order Placed Successfully!",
            description: "Your order is now being processed.",
        });
        clearCart();
        router.push(`/my-orders/${result.orderId}`);
    } else {
        toast({
            variant: "destructive",
            title: "Failed to Place Order",
            description: result.message || "An unexpected error occurred. Please try again.",
        });
    }
  };


  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center py-20">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
            <Frown className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Your Cart is Empty</CardTitle>
          <CardDescription>Looks like you haven't added anything to your cart yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Cart Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/listings/${item.id}`} className="font-semibold hover:underline">
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <p className="text-lg font-bold text-primary mt-1">Rs {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                      className="w-16 h-9 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
           <CardFooter className="p-4 justify-end">
            <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-1 sticky top-24 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5" /> Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Textarea 
                id="shipping-address"
                placeholder="Enter your full shipping address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={4}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="contact-number">Contact Number</Label>
              <Input 
                id="contact-number"
                placeholder="Enter your contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">Rs {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>Rs {subtotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button size="lg" className="w-full" disabled={!isOrderReady || isPlacingOrder} onClick={handlePlaceOrder}>
              {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Order
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
