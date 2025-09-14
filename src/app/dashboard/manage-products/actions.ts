
'use server';

import type { Product } from '@/lib/types';
import { get, ref, update, query, orderByChild, startAt, endAt, limitToFirst, limitToLast } from 'firebase/database';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateProductSchema } from '@/lib/schemas/product';

interface ProductFilters {
    q?: string;
    category?: string;
    subcategory?: string;
    from?: string;
    to?: string;
    stock?: 'low' | 'out';
    status?: Product['status'];
}

// Function to get the low stock threshold from DB
async function getLowStockThreshold(): Promise<number> {
    try {
        const { db } = initializeAdmin();
        const configRef = db.ref('site_config/stockThreshold');
        const snapshot = await configRef.once('value');
        return snapshot.exists() ? snapshot.val() : 5; // Default to 5
    } catch {
        return 5; // Default on error
    }
}


export async function getManageableProducts(
    page: number = 1, 
    limit: number = 10,
    filters?: ProductFilters
): Promise<{ products: Product[], total: number }> {
  try {
    const { db } = initializeAdmin();
    const productsRef = ref(db, 'products');
    const snapshot = await get(productsRef);
    
    let allProducts: Product[] = [];
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      allProducts = Object.keys(productsData).map(key => ({
        ...productsData[key],
        id: key,
      }));
    }
    
    let filteredProducts = allProducts;
    const lowStockThreshold = await getLowStockThreshold();


    if (filters) {
        const { q, category, subcategory, from, to, stock, status } = filters;
        const searchQuery = q?.toLowerCase();
        
        filteredProducts = filteredProducts.filter(product => {
            const searchMatch = searchQuery
                ? product.name.toLowerCase().includes(searchQuery) || 
                  (product.description && product.description.toLowerCase().includes(searchQuery)) ||
                  (product.displayId && product.displayId.toLowerCase().includes(searchQuery))
                : true;
            
            const categoryMatch = category ? product.category === category : true;
            const subcategoryMatch = subcategory ? product.subcategory === subcategory : true;
            const statusMatch = status ? product.status === status : true;
            
            const createdAt = new Date(product.createdAt);
            const fromDate = from ? new Date(from) : null;
            const toDate = to ? new Date(to) : null;

            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);

            const dateMatch = (!fromDate || createdAt >= fromDate) && (!toDate || createdAt <= toDate);

            const stockMatch = !stock || (stock === 'low' && product.stock && product.stock <= lowStockThreshold && product.stock > 0) || (stock === 'out' && product.stock === 0);

            return searchMatch && categoryMatch && subcategoryMatch && dateMatch && stockMatch && statusMatch;
        });
    }

    const sortedProducts = filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = sortedProducts.length;
    const paginatedProducts = sortedProducts.slice((page - 1) * limit, page * limit);

    return { products: paginatedProducts, total };

  } catch (error) {
    console.error("Error fetching manageable products from Firebase:", error);
    return { products: [], total: 0 };
  }
}

export async function updateProductStatus(
    productId: string, 
    status: Product['status']
): Promise<{ success: boolean; message?: string }> {
    try {
        const { db } = initializeAdmin();
        const productRef = ref(db, `products/${productId}`);
        await update(productRef, { status });
        
        revalidatePath('/');
        revalidatePath(`/listings/${productId}`);
        revalidatePath('/dashboard/manage-products');

        return { success: true };
    } catch (error) {
        console.error("Error updating product status:", error);
        return { success: false, message: 'Failed to update product status.' };
    }
}


export async function updateProduct(
    values: z.infer<typeof updateProductSchema>
): Promise<{ success: boolean; message?: string }> {
    const validatedFields = updateProductSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid form data.',
        };
    }

    const { id, ...productData } = validatedFields.data;

    try {
        const { db } = initializeAdmin();
        const productRef = ref(db, `products/${id}`);
        await update(productRef, productData);
        
        revalidatePath('/');
        revalidatePath(`/listings/${id}`);
        revalidatePath('/dashboard/manage-products');

        return { success: true };
    } catch (error) {
        console.error("Error updating product:", error);
        return { success: false, message: 'Failed to update product.' };
    }
}

