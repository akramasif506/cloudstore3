
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { FeeConfig } from '@/lib/types';

const feeSchema = z.object({
  platformFeePercent: z.coerce.number().min(0, 'Platform fee cannot be negative.').max(100, 'Platform fee cannot exceed 100%.'),
  handlingFeeFixed: z.coerce.number().min(0, 'Handling fee cannot be negative.'),
});

const FEES_PATH = 'site_config/fees';

export async function getFeeConfig(): Promise<FeeConfig | null> {
    const { db } = initializeAdmin();
    try {
        const feesRef = db.ref(FEES_PATH);
        const snapshot = await feesRef.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return { platformFeePercent: 0, handlingFeeFixed: 0 }; // Default if not set
    } catch (error) {
        console.error('Error fetching fee config:', error);
        return null;
    }
}

export async function setFeeConfig(
  values: z.infer<typeof feeSchema>
): Promise<{ success: boolean; message: string }> {
  const validatedFields = feeSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const { db } = initializeAdmin();

  try {
    const feesRef = db.ref(FEES_PATH);
    await feesRef.set(validatedFields.data);

    revalidatePath('/cart'); // Revalidate cart to reflect new fees

    return { success: true, message: 'Fee configuration has been updated.' };
  } catch (error) {
    console.error('Error setting fee config:', error);
    return { success: false, message: 'Failed to set fee configuration.' };
  }
}
