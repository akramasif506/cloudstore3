
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Frown, Home, Phone, Loader2, LogIn, Percent, Package, Tag, Plus, Minus, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { placeOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export function CartContents() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    subtotal, 
    platformFee, 
    handlingFee,
    tax, 
    total,
    appliedDiscount,
    setPinCode,
    selectedItems,
    toggleItemSelection,
    toggleSelectAll,
    removeSelectedFromCart,
    isAllSelected,
  } = useCart();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [pinCodeValue, setPinCodeValue] = useState('');
  const [orderComments, setOrderComments] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const itemsToOrder = items.filter(item => selectedItems.has(item.id));
  const hasSelection = itemsToOrder.length > 0;

  useEffect(() => {
    if (user) {
      setShippingAddress(user.address || '');
      setContactNumber(user.mobileNumber || '');
    }
  }, [user]);

  // Effect to extract PIN code from address and update context
  useEffect(() => {
    const pinMatch = shippingAddress.match(/\b\d{6}\b/);
    const newPinCode = pinMatch ? pinMatch[0] : '';
    setPinCodeValue(newPinCode);
    setPinCode(newPinCode);
  }, [shippingAddress, setPinCode]);


  const isOrderReady = hasSelection && shippingAddress.trim().length >= 10 && contactNumber.trim().length >= 10 && user;

  const handlePlaceOrder = async () => {
    if (!isOrderReady || !user) {
        toast({
            variant: "destructive",
            title: "Cannot place order",
            description: "Please log in, select at least one item, and fill in all shipping information.",
        });
        return;
    }

    setIsPlacingOrder(true);
    
    const result = await placeOrder({
        userId: user.id,
        customerName: user.name || 'Valued Customer',
        items: itemsToOrder,
        shippingAddress: shippingAddress,
        contactNumber,
        pinCode: pinCodeValue,
        comments: orderComments,
    });
    setIsPlacingOrder(false);

    if (result.success && result.orderId) {
        toast({
            title: "Order Placed Successfully!",
            description: "Your order is now being processed.",
        });
        removeSelectedFromCart();
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="select-all" 
                checked={isAllSelected} 
                onCheckedChange={toggleSelectAll} 
              />
              <Label htmlFor="select-all" className="text-lg cursor-pointer">
                Cart Items ({items.reduce((sum, item) => sum + item.quantity, 0)})
              </Label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4">
                  <Checkbox 
                    className="mt-8 flex-shrink-0"
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />
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
                    <p className="text-lg font-bold text-destructive mt-1">Rs {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                            type="number"
                            className="w-12 h-8 text-center"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                            min="1"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
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
        {!user && (
          <Alert>
            <LogIn className="h-4 w-4" />
            <AlertTitle>You're not logged in!</AlertTitle>
            <AlertDescription>
              <Button variant="link" asChild className="p-0 h-auto">
                 <Link href="/login?redirect=/cart">Log in</Link>
              </Button> to use your saved details and place an order.
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5" /> Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="shippingAddress">Full Shipping Address</Label>
                <Textarea
                    id="shippingAddress"
                    placeholder="Enter your full shipping address, including PIN code..."
                    rows={4}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
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
             <div className="space-y-2">
                <Label htmlFor="order-comments">Order Comments (Optional)</Label>
                <Textarea
                    id="order-comments"
                    placeholder="e.g. It's a birthday gift!"
                    rows={2}
                    value={orderComments}
                    onChange={(e) => setOrderComments(e.target.value)}
                />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Order Summary ({itemsToOrder.length} item{itemsToOrder.length !== 1 ? 's' : ''})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
            {appliedDiscount && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="font-medium flex items-center gap-1"><Tag className="h-3 w-3" /> {appliedDiscount.name}</span>
                <span className="font-medium">- Rs {appliedDiscount.value.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-destructive">Free</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>Rs {total.toFixed(2)}</span>
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
