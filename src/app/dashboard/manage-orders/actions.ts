
'use server';

import type { Order, User, ProductSeller } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getAllOrders(): Promise<Order[]> {
  try {
    const { db } = initializeAdmin();
    // Fetch from the denormalized 'all_orders' path for a complete list
    const ordersRef = db.ref('all_orders');
    const snapshot = await ordersRef.once('value');
    
    if (snapshot.exists()) {
      const ordersData = snapshot.val();
      const allOrders: Order[] = Object.keys(ordersData).map(key => ({ ...ordersData[key], internalId: key }));
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const isOldAndClosed = orderDate < twoDaysAgo && (order.status === 'Delivered' || order.status === 'Cancelled');
        return !isOldAndClosed;
      });
        
      // Sort the filtered orders by creation date, newest first
      return filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
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
