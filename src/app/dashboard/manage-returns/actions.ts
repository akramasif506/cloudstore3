
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

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

    // Revalidate relevant pages if needed in the future
    // revalidatePath('/my-orders');

    return { success: true, message: 'Return policy has been updated.' };
  } catch (error) {
    console.error('Error setting return policy:', error);
    return { success: false, message: 'Failed to set return policy.' };
  }
}
