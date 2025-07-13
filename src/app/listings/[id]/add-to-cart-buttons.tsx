
"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { ShoppingCart } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import Link from 'next/link';

interface AddToCartButtonsProps {
  product: Product;
}

export function AddToCartButtons({ product }: AddToCartButtonsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} is now in your shopping cart.`,
      action: (
          <ToastAction asChild altText="Continue shopping">
            <Link href="/">Continue Shopping</Link>
          </ToastAction>
        ),
    });
  };

  return (
    <>
      <Button size="lg" className="w-full text-lg" onClick={handleAddToCart}>
        <ShoppingCart className="mr-2" /> Buy Now
      </Button>
      <Button variant="outline" size="lg" className="w-full mt-4">
        Make an Offer
      </Button>
    </>
  );
}
