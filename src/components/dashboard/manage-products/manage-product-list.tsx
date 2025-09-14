
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
import { Loader2, CheckCircle, PackageCheck, PackageX, Edit, User, Eye, Phone, AlertCircle, Image as ImageIcon, Star } from 'lucide-react';
import Link from 'next/link';
import { EditProductDialog } from './edit-product-dialog';
import { updateProductStatus, toggleFeaturedStatus } from '@/app/dashboard/manage-products/actions';
import { Badge } from '@/components/ui/badge';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManageProductListProps {
  products: Product[];
  categories: CategoryMap;
}

const statusStyles: Record<Product['status'], string> = {
    active: 'bg-green-100 text-green-800',
    sold: 'bg-red-100 text-red-800',
    pending_review: 'bg-amber-100 text-amber-800',
    rejected: 'bg-destructive/20 text-destructive',
    pending_image: 'bg-gray-100 text-gray-800'
};

const statusIcons: Record<Product['status'], React.ReactNode> = {
    active: <CheckCircle className="h-4 w-4" />,
    sold: <PackageX className="h-4 w-4" />,
    pending_review: <AlertCircle className="h-4 w-4" />,
    rejected: <AlertCircle className="h-4 w-4" />,
    pending_image: <ImageIcon className="h-4 w-4" />,
};

export function ManageProductList({ products, categories }: ManageProductListProps) {
  const [productList, setProductList] = useState(products);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProductUpdate = (updatedProduct: Product) => {
    setProductList(currentProducts => currentProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    toast({
      title: "Product Updated",
      description: "The listing details have been saved.",
      variant: 'default',
    });
  }

  const handleUpdateError = (message: string) => {
     toast({
        title: "Update Failed",
        description: message || "Could not update the product. Please try again.",
        variant: 'destructive',
      });
  }

  const handleStatusChange = async (product: Product, newStatus: Product['status']) => {
    setUpdatingStatusId(product.id);
    const result = await updateProductStatus(product.id, newStatus);
    setUpdatingStatusId(null);

    if (result.success) {
        setProductList(currentProducts => currentProducts.map(p => 
            p.id === product.id ? {...p, status: newStatus} : p
        ));
        toast({
            title: "Status Updated",
            description: `Product has been marked as ${newStatus.replace('_', ' ')}.`
        });
    } else {
        toast({
            variant: "destructive",
            title: "Status Update Failed",
            description: result.message
        });
    }
  }

  const handleFeatureToggle = async (product: Product) => {
    setUpdatingStatusId(product.id);
    const newFeaturedState = !product.isFeatured;
    const result = await toggleFeaturedStatus(product.id, newFeaturedState);
    setUpdatingStatusId(null);

    if (result.success) {
        setProductList(currentProducts => currentProducts.map(p => 
            p.id === product.id ? {...p, isFeatured: newFeaturedState} : p
        ));
        toast({
            title: `Product ${newFeaturedState ? 'Featured' : 'Unfeatured'}`,
            description: `${product.name} is now ${newFeaturedState ? 'featured' : 'no longer featured'}.`
        });
    } else {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.message
        });
    }
  }


  if (products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
        <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
        <h3 className="text-xl font-semibold">No Products Found</h3>
        <p>Try adjusting your filters or clearing them to see all products.</p>
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
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {productList.map((product) => (
            <TableRow key={product.id}>
                <TableCell>
                  <Link href={`/listings/${product.id}`} target="_blank" rel="noopener noreferrer">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden">
                        <Image
                        src={product.imageUrl || 'https://placehold.co/100x100.png'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        />
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  {product.name}
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
                <TableCell>
                    <Badge variant={'secondary'} className={statusStyles[product.status]}>
                        <div className="flex items-center gap-2 capitalize">
                           {statusIcons[product.status]}
                           {product.status.replace('_', ' ')}
                        </div>
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                 {updatingStatusId === product.id ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleFeatureToggle(product)}
                        aria-label="Toggle featured status"
                      >
                          <Star className={cn("h-4 w-4", product.isFeatured ? "text-amber-400 fill-amber-400" : "text-muted-foreground")}/>
                      </Button>
                      <EditProductDialog
                        product={product}
                        categories={categories}
                        onSuccess={handleProductUpdate}
                        onError={handleUpdateError}
                      />
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/listings/${product.id}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Status Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           {Object.keys(statusStyles).map(status => (
                                <DropdownMenuItem
                                    key={status}
                                    disabled={product.status === status}
                                    onClick={() => handleStatusChange(product, status as Product['status'])}
                                    className="capitalize"
                                >
                                    Mark as {status.replace('_', ' ')}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
