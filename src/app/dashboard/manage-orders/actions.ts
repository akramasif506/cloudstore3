
'use server';

import type { Order } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getAllOrders(): Promise<Order[]> {
  try {
    const { db } = initializeAdmin();
    const ordersRef = db.ref('orders');
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
    const orderRef = db.ref(`orders/${orderId}`);
    await orderRef.update({ status });

    revalidatePath('/dashboard/manage-orders');
    revalidatePath(`/my-orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, message: 'Failed to update order status.' };
  }
}
