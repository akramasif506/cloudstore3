
'use server';

import type { Order, User, ProductSeller } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

interface OrderFilters {
    q?: string;
    status?: Order['status'];
    from?: string;
    to?: string;
}

export async function getAllOrders(
    page: number = 1,
    limit: number = 10,
    filters?: OrderFilters
): Promise<{ orders: Order[], total: number }> {
  try {
    const { db } = initializeAdmin();
    // Fetch from the denormalized 'all_orders' path for a complete list
    const ordersRef = db.ref('all_orders');
    const snapshot = await ordersRef.once('value');
    
    let allOrders: Order[] = [];
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      allOrders = Object.keys(ordersData).map(key => ({ ...ordersData[key], internalId: key }));
    }

    let filteredOrders = allOrders;

    if (filters) {
        const { q, status, from, to } = filters;
        const searchQuery = q?.toLowerCase();

        filteredOrders = filteredOrders.filter(order => {
            const searchMatch = searchQuery ? order.id.toLowerCase().includes(searchQuery) : true;
            const statusMatch = status ? order.status === status : true;
            
            const createdAt = new Date(order.createdAt);
            const fromDate = from ? new Date(from) : null;
            const toDate = to ? new Date(to) : null;

            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);
            
            const dateMatch = (!fromDate || createdAt >= fromDate) && (!toDate || createdAt <= toDate);

            return searchMatch && statusMatch && dateMatch;
        });
    }
    
    // Sort all orders by creation date, newest first
    const sortedOrders = filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = sortedOrders.length;
    const paginatedOrders = sortedOrders.slice((page - 1) * limit, page * limit);

    return { orders: paginatedOrders, total };

  } catch (error) {
    console.error("Error fetching all orders:", error);
    return { orders: [], total: 0 };
  }
}

export async function updateOrderStatus(
  internalOrderId: string,
  status: Order['status']
): Promise<{ success: boolean; message?: string }> {
  try {
    const { db } = initializeAdmin();
    // To update status, we need to find the original record under the user's ID
    const globalOrderRef = db.ref(`all_orders/${internalOrderId}`);
    const snapshot = await globalOrderRef.once('value');
    if (!snapshot.exists()) {
        return { success: false, message: 'Order not found.' };
    }
    const orderData = snapshot.val();
    const userId = orderData.userId;

    if (!userId) {
        return { success: false, message: 'User ID missing from order data, cannot update.' };
    }

    // Update both the user-specific record and the global record for consistency
    const userOrderRef = db.ref(`orders/${userId}/${internalOrderId}`);
    await userOrderRef.update({ status });
    await globalOrderRef.update({ status });

    revalidatePath('/dashboard/manage-orders');
    revalidatePath(`/my-orders/${internalOrderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: 'Failed to update order status.' };
  }
}

export async function getOrderWithSellerDetails(order: Order): Promise<Order> {
    const { db } = initializeAdmin();
    const sellerIds = [...new Set(order.items.map(item => item.seller?.id).filter(Boolean))];

    const sellerDetailsPromises = sellerIds.map(async (sellerId) => {
        if (!sellerId || sellerId === 'unknown') {
            return { id: sellerId, details: null };
        }
        const userRef = db.ref(`users/${sellerId}`);
        const snapshot = await userRef.once('value');
        return { id: sellerId, details: snapshot.exists() ? snapshot.val() as User : null };
    });

    const sellerResults = await Promise.all(sellerDetailsPromises);
    const sellerDetailsMap = new Map(sellerResults.map(s => [s.id, s.details]));

    const itemsWithFullSellerInfo = order.items.map(item => {
        const sellerId = item.seller?.id;
        if (sellerId && sellerDetailsMap.has(sellerId)) {
            const details = sellerDetailsMap.get(sellerId);
            return {
                ...item,
                seller: {
                    ...item.seller,
                    name: details?.name || item.seller?.name || 'Unknown Seller',
                    contactNumber: details?.mobileNumber || item.seller?.contactNumber || 'N/A',
                    address: details?.address || 'N/A',
                }
            };
        }
        return item;
    });

    return {
        ...order,
        items: itemsWithFullSellerInfo,
    };
}
