
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Frown } from 'lucide-react';

export function CartContents() {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();

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
      <div className="lg:col-span-2">
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

      <div className="lg:col-span-1 sticky top-24">
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
            <Button size="lg" className="w-full">Place Order</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
