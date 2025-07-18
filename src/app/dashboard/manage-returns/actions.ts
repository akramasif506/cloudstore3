

'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Order, ReturnRequest, ReturnStatus } from '@/lib/types';

export interface ReturnPolicy {
  isEnabled: boolean;
  returnWindowDays: number;
  policyText: string;
}

const policySchema = z.object({
  isEnabled: z.boolean(),
  returnWindowDays: z.coerce.number().min(0, 'Return window must be 0 or more days.'),
  policyText: z.string().min(10, 'Policy text must be at least 10 characters.'),
});

const POLICY_PATH = 'site_config/return_policy';
const RETURN_REQUESTS_PATH = 'return_requests';

export async function getReturnPolicy(): Promise<ReturnPolicy> {
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
        policyText: 'Enter your return policy details here. Explain the conditions under which returns are accepted, who covers shipping costs, and the process for initiating a return. For example: "Items can be returned within 7 days of delivery for a full refund. The item must be in its original condition. Buyer is responsible for return shipping costs."',
    };
}

export async function setReturnPolicy(
  values: z.infer<typeof policySchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = policySchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { db } = initializeAdmin();

  try {
    const policyRef = db.ref(POLICY_PATH);
    await policyRef.set(validatedFields.data);

    revalidatePath('/my-orders');

    return { success: true, message: 'Return policy has been updated.' };
  } catch (error) {
    console.error('Error setting return policy:', error);
    return { success: false, message: 'Failed to set return policy.' };
  }
}

export async function getAllReturnRequests(): Promise<ReturnRequest[]> {
    const { db } = initializeAdmin();
    try {
        const requestsRef = db.ref(RETURN_REQUESTS_PATH);
        const snapshot = await requestsRef.orderByChild('requestedAt').once('value');
        if (snapshot.exists()) {
            const data = snapshot.val();
            return Object.values(data).reverse(); // Newest first
        }
        return [];
    } catch (error) {
        console.error('Error fetching return requests:', error);
        return [];
    }
}

export async function updateReturnStatus(
    requestId: string,
    orderId: string,
    userId: string,
    newStatus: 'Approved' | 'Rejected'
): Promise<{ success: boolean; message: string }> {
    const { db } = initializeAdmin();
    const returnStatusMap: Record<typeof newStatus, ReturnStatus> = {
        'Approved': 'Return Approved',
        'Rejected': 'Return Rejected',
    };
    
    try {
        const returnRequestRef = db.ref(`${RETURN_REQUESTS_PATH}/${requestId}`);
        const orderRef = db.ref(`orders/${userId}/${orderId}`);
        const globalOrderRef = db.ref(`all_orders/${orderId}`);

        // Update status on the return request itself
        await returnRequestRef.update({ status: newStatus });
        
        // Update status on the user's order and the global order
        const orderUpdate = { returnStatus: returnStatusMap[newStatus] };
        await orderRef.update(orderUpdate);
        await globalOrderRef.update(orderUpdate);

        revalidatePath('/dashboard/manage-returns');
        revalidatePath('/my-orders');
        
        return { success: true, message: `Return request has been ${newStatus.toLowerCase()}.` };
    } catch (error) {
        console.error('Error updating return status:', error);
        return { success: false, message: 'Failed to update return status.' };
    }
}
