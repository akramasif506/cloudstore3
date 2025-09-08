

'use server';

import type { Order, ReturnPolicy } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

const returnSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  reason: z.string().min(10, 'A reason for return (min. 10 characters) is required.'),
});

const POLICY_PATH = 'site_config/return_policy';

/**
 * Fetches the return policy. This is a server action that can be called
 * from client components to get up-to-date policy info.
 */
export async function getMyOrdersReturnPolicy(): Promise<ReturnPolicy> {
    const { db } = initializeAdmin();
    try {
        const policyRef = db.ref(POLICY_PATH);
        const snapshot = await policyRef.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
    } catch (error) {
        console.error('Error fetching return policy:', error);
    }
    // Return a default policy if none is set
    return {
        isEnabled: false,
        returnWindowDays: 7,
        policyText: 'Returns are not currently enabled.',
    };
}


export async function getMyOrders(userId: string): Promise<Order[]> {
  if (!userId) {
    return [];
  }

  let db;
  try {
    ({ db } = initializeAdmin());
  } catch (error) {
    console.error("Admin SDK init failed:", error);
    return [];
  }
  
  try {
    const ordersRef = db.ref('all_orders');
    const snapshot = await ordersRef.once('value');
    
    let allOrders: Order[] = [];
    if (snapshot.exists()) {
        const ordersData = snapshot.val();
        allOrders = Object.keys(ordersData).map(key => ({ ...ordersData[key], internalId: key }));
    }
    
    // Filter orders for the specific user
    const userOrders = allOrders.filter(order => order.userId === userId);
    
    // Sort by creation date, newest first
    return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  } catch (error) {
    console.error("Error fetching user orders from Firebase:", error);
    return [];
  }
}


export async function requestReturn(
  values: z.infer<typeof returnSchema>
): Promise<{ success: boolean; message: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: 'You must be logged in.' };
    }

    const validatedFields = returnSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid data provided.' };
    }

    const { orderId, reason } = validatedFields.data;
    const { db } = initializeAdmin();

    try {
        const userId = user.id;
        
        // 1. Fetch the original order to ensure it belongs to the user and to store a snapshot
        const orderRef = db.ref(`orders/${userId}/${orderId}`);
        const orderSnapshot = await orderRef.once('value');
        if (!orderSnapshot.exists()) {
            return { success: false, message: 'Order not found or you do not have permission to access it.' };
        }
        const orderData = orderSnapshot.val();

        // 2. Create the return request ID
        const returnRequestId = uuidv4();

        // 3. Create the return request object
        const returnRequest = {
            id: returnRequestId,
            orderId,
            userId,
            reason,
            requestedAt: new Date().toISOString(),
            status: 'Pending' as const,
            order: orderData, // Embed the order data for easier display in the admin panel
        };

        // 4. Save the return request
        const returnRequestRef = db.ref(`return_requests/${returnRequestId}`);
        await returnRequestRef.set(returnRequest);

        // 5. Update the original order to reflect the return request
        await orderRef.update({
            returnStatus: 'Return Requested',
            returnRequestId: returnRequestId,
        });
        
        const globalOrderRef = db.ref(`all_orders/${orderId}`);
        await globalOrderRef.update({
             returnStatus: 'Return Requested',
             returnRequestId: returnRequestId,
        });

        // 6. Revalidate paths
        revalidatePath('/my-orders');
        revalidatePath('/dashboard/manage-returns');

        return { success: true, message: 'Your return request has been submitted.' };
    } catch (error) {
        console.error('Error submitting return request:', error);
        return { success: false, message: 'Failed to submit return request.' };
    }
}


export async function cancelOrder(orderInternalId: string): Promise<{ success: boolean; message: string }> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, message: 'You must be logged in to cancel an order.' };
    }

    const { db } = initializeAdmin();

    try {
        const orderRef = db.ref(`orders/${user.id}/${orderInternalId}`);
        const globalOrderRef = db.ref(`all_orders/${orderInternalId}`);

        // Fetch the order to verify status and ownership
        const orderSnapshot = await orderRef.once('value');
        if (!orderSnapshot.exists()) {
            return { success: false, message: 'Order not found or you do not have permission.' };
        }

        const orderData: Order = orderSnapshot.val();
        if (orderData.status !== 'Pending') {
            return { success: false, message: `This order cannot be cancelled as it is already ${orderData.status}.` };
        }

        // Update both the user-specific and global order records
        await orderRef.update({ status: 'Cancelled' });
        await globalOrderRef.update({ status: 'Cancelled' });

        revalidatePath('/my-orders');
        revalidatePath(`/my-orders/${orderInternalId}`);
        revalidatePath('/dashboard/manage-orders');

        return { success: true, message: 'Your order has been cancelled.' };

    } catch (error) {
        console.error('Error cancelling order:', error);
        return { success: false, message: 'Failed to cancel the order. Please try again.' };
    }
}
