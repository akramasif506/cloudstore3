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
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Info, Edit, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { EditProductDialog } from './edit-product-dialog';
import { RejectProductDialog } from './reject-product-dialog';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import type { ProductConditionMap } from '@/app/dashboard/manage-product-conditions/actions';

interface PendingProductListProps {
  initialProducts: Product[];
  categories: CategoryMap;
  conditions: ProductConditionMap;
}

export function PendingProductList({ initialProducts, categories, conditions }: PendingProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const { toast } = useToast();

  const handleProductUpdate = (productId: string) => {
    // Remove the approved/rejected product from the list
    setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
    toast({
      title: "Product Approved",
      description: "The listing is now active and visible to all users.",
      variant: 'default',
    });
  }
  
  const handleProductReject = (productId: string) => {
    setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
    toast({
        title: "Product Rejected",
        description: "The listing has been rejected and the seller has been notified.",
        variant: 'default',
    })
  }

  const handleUpdateError = (message: string) => {
     toast({
        title: "Update Failed",
        description: message || "Could not update the product. Please try again.",
        variant: 'destructive',
      });
  }


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
            <TableHead>Contact</TableHead>
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
                 <TableCell>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{product.seller?.name || 'N/A'}</span>
                    </div>
                </TableCell>
                <TableCell>
                    {product.seller?.contactNumber && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{product.seller.contactNumber}</span>
                        </div>
                    )}
                </TableCell>
                <TableCell>Rs {product.price.toFixed(2)}</TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                    <RejectProductDialog
                        productId={product.id}
                        onSuccess={handleProductReject}
                        onError={handleUpdateError}
                    />
                    <EditProductDialog
                        product={product}
                        categories={categories}
                        conditions={conditions}
                        onSuccess={handleProductUpdate}
                        onError={handleUpdateError}
                    />
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
