
'use server';

import type { Order } from '@/lib/types';
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
      return Object.keys(ordersData)
        .map(key => ({ ...ordersData[key], id: key }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<{ success: boolean; message?: string }> {
  try {
    const { db } = initializeAdmin();
    // To update status, we need to find the original record under the user's ID
    const globalOrderRef = db.ref(`all_orders/${orderId}`);
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
    const userOrderRef = db.ref(`orders/${userId}/${orderId}`);
    await userOrderRef.update({ status });
    await globalOrderRef.update({ status });

    revalidatePath('/dashboard/manage-orders');
    revalidatePath(`/my-orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: 'Failed to update order status.' };
  }
}
