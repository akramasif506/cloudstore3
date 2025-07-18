
"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import Link from 'next/link';
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface AddToCartButtonsProps {
  product: Product;
}

export function AddToCartButtons({ product }: AddToCartButtonsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: "Added to cart!",
      description: `${product.name} is now in your cart.`,
      action: (
        <ToastAction altText="View cart" asChild>
          <Link href="/cart">View Cart</Link>
        </ToastAction>
      ),
    });
  };

  return (
    <div className="flex gap-4">
        <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                <Minus className="h-5 w-5" />
            </Button>
            <Input 
                type="number"
                className="w-16 h-12 text-center text-lg font-bold"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
            />
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => setQuantity(q => q + 1)}>
                <Plus className="h-5 w-5" />
            </Button>
        </div>
      <Button size="lg" className="w-full text-lg h-12" onClick={handleAddToCart}>
        <ShoppingCart className="mr-2" /> Add to Cart
      </Button>
    </div>
  );
}
