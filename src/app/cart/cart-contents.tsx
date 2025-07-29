
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Frown, Home, Phone, Loader2, LogIn, Percent, Package } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { placeOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Helper to parse the full address string into parts
const parseAddress = (fullAddress: string) => {
    const parts = fullAddress.split(',').map(part => part.trim());
    const addressLine1 = parts[0] || '';
    const city = parts.find(p => p.startsWith('City:'))?.replace('City:', '').trim() || '';
    const district = parts.find(p => p.startsWith('Dist:'))?.replace('Dist:', '').trim() || '';
    const pinCode = parts.find(p => p.startsWith('PIN:'))?.replace('PIN:', '').trim() || '';
    const state = parts.find(p => p.toLowerCase() === 'assam') || 'Assam';
    
    // A more robust parsing for pre-filled data
    if (fullAddress && !fullAddress.includes(',')) {
      return { addressLine1: fullAddress, city: '', district: '', pinCode: '', state: 'Assam' };
    }

    return { addressLine1, city, district, pinCode, state };
};

export function CartContents() {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart, platformFee, handlingFee, total } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('Assam');
  const [contactNumber, setContactNumber] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.address) {
          const { addressLine1, city, district, pinCode, state } = parseAddress(user.address);
          setAddressLine1(addressLine1);
          setCity(city);
          setDistrict(district);
          setPinCode(pinCode);
          setState(state);
      }
      setContactNumber(user.mobileNumber || '');
    }
  }, [user]);

  const isOrderReady = addressLine1.trim() !== '' && city.trim() !== '' && district.trim() !== '' && pinCode.trim() !== '' && contactNumber.trim() !== '' && user;

  const handlePlaceOrder = async () => {
    if (!isOrderReady || !user) {
        toast({
            variant: "destructive",
            title: "Cannot place order",
            description: "Please log in and fill in all shipping information.",
        });
        return;
    }

    setIsPlacingOrder(true);
    // Combine address fields into a single string
    const fullShippingAddress = `${addressLine1}, City: ${city}, Dist: ${district}, PIN: ${pinCode}, ${state}, India`;
    
    const result = await placeOrder({
        userId: user.id,
        customerName: user.name || 'Valued Customer',
        items,
        shippingAddress: fullShippingAddress,
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
                    <p className="text-lg font-bold text-accent mt-1">Rs {item.price.toFixed(2)}</p>
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
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                placeholder="Street address, P.O. box, company name"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="e.g. Guwahati" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input id="district" placeholder="e.g. Kamrup" value={district} onChange={(e) => setDistrict(e.target.value)} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code</Label>
                    <Input id="pinCode" placeholder="e.g. 781001" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={state} readOnly disabled />
                </div>
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
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-primary">Free</span>
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
