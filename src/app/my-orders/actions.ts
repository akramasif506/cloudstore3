

'use server';

import type { Order } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

const returnSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required.'),
  reason: z.string().min(10, 'A reason for return (min. 10 characters) is required.'),
});

export async function getMyOrders(): Promise<Order[]> {
  const session = cookies().get('session')?.value;
  if (!session) {
    return []; // Not logged in
  }

  let db, adminAuth;
  try {
    ({ db, adminAuth } = initializeAdmin());
  } catch (error) {
    console.error("Admin SDK init failed:", error);
    return [];
  }
  
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Fetch orders directly from the user's node, which is much more efficient.
    const userOrdersRef = db.ref(`orders/${userId}`);
    const snapshot = await userOrdersRef.orderByChild('createdAt').once('value');
    
    if (snapshot.exists()) {
        const ordersData = snapshot.val();
        // The data is an object of orders, convert it to an array
        const userOrders = Object.keys(ordersData)
            .map(key => ({ ...ordersData[key], id: key }))
            // Sort by creation date, newest first
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return userOrders;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user orders from Firebase:", error);
    // This could be a verification error or a database error
    return [];
  }
}


export async function requestReturn(
  values: z.infer<typeof returnSchema>
): Promise<{ success: boolean; message: string }> {
    const session = cookies().get('session')?.value;
    if (!session) {
        return { success: false, message: 'You must be logged in.' };
    }

    const validatedFields = returnSchema.safeParse(values);
    if (!validatedFields.success) {
        return { success: false, message: 'Invalid data provided.' };
    }

    const { orderId, reason } = validatedFields.data;
    const { db, adminAuth } = initializeAdmin();

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(session, true);
        const userId = decodedClaims.uid;
        
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

        // 6. Revalidate paths
        revalidatePath('/my-orders');
        revalidatePath('/dashboard/manage-returns');

        return { success: true, message: 'Your return request has been submitted.' };
    } catch (error) {
        console.error('Error submitting return request:', error);
        return { success: false, message: 'Failed to submit return request.' };
    }
}
