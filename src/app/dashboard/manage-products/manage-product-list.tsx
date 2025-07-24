
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
import { Loader2, CheckCircle, PackageCheck, PackageX, Edit, User, Eye, Phone } from 'lucide-react';
import Link from 'next/link';
import { EditProductDialog } from './edit-product-dialog';
import { updateProductStatus } from './actions';
import { Badge } from '@/components/ui/badge';
import type { CategoryMap } from '../manage-categories/actions';

interface ManageProductListProps {
  products: Product[];
  categories: CategoryMap;
}

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

  const handleToggleStatus = async (product: Product) => {
    setUpdatingStatusId(product.id);
    const newStatus = product.status === 'active' ? 'sold' : 'active';
    const result = await updateProductStatus(product.id, newStatus);
    setUpdatingStatusId(null);

    if (result.success) {
        setProductList(currentProducts => currentProducts.map(p => 
            p.id === product.id ? {...p, status: newStatus} : p
        ));
        toast({
            title: "Status Updated",
            description: `Product has been marked as ${newStatus}.`
        });
    } else {
        toast({
            variant: "destructive",
            title: "Status Update Failed",
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
            {products.map((product) => (
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
                    <Badge variant={product.status === 'active' ? 'secondary' : 'default'} className={product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {product.status === 'active' ? 'Active' : 'Sold'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingStatusId === product.id}
                    onClick={() => handleToggleStatus(product)}
                  >
                    {updatingStatusId === product.id 
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : product.status === 'active' 
                            ? <PackageX className="mr-2 h-4 w-4" /> 
                            : <PackageCheck className="mr-2 h-4 w-4" />
                    }
                    {product.status === 'active' ? 'Mark Sold' : 'Mark Active'}
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
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
