
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { CartContents } from './cart-contents';

export default function CartPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
         <div className="flex items-center gap-4">
            <div className="flex-shrink-0 bg-primary/10 text-primary rounded-lg p-3">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline">My Cart</h1>
              <p className="text-muted-foreground">Review your items and proceed to checkout.</p>
            </div>
          </div>
      </div>
      <CartContents />
    </div>
  );
}
