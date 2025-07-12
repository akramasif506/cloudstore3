// src/app/dashboard/pending-products/pending-product-list.tsx
"use client";

import { useState } from 'react';
import type { Product } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { approveProduct } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface PendingProductListProps {
  initialProducts: Product[];
}

export function PendingProductList({ initialProducts }: PendingProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (productId: string) => {
    setApprovingId(productId);
    const result = await approveProduct(productId);
    if (result.success) {
      // Remove the approved product from the list
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
      toast({
        title: "Product Approved",
        description: "The listing is now active and visible to all users.",
        variant: 'default',
      });
    } else {
      toast({
        title: "Approval Failed",
        description: result.message || "Could not approve the product. Please try again.",
        variant: 'destructive',
      });
    }
    setApprovingId(null);
  };

  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">All Caught Up!</h3>
        <p>There are no pending products to review.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.map((product) => (
            <TableRow key={product.id}>
                <TableCell>
                <div className="relative h-12 w-12 rounded-md overflow-hidden">
                    <Image
                    src={product.imageUrl || 'https://placehold.co/100x100.png'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    />
                </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/listings/${product.id}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell>{product.seller.name}</TableCell>
                <TableCell>₹{product.price.toFixed(2)}</TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                <Button
                    onClick={() => handleApprove(product.id)}
                    disabled={approvingId === product.id}
                    size="sm"
                >
                    {approvingId === product.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve
                </Button>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
