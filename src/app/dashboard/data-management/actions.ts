
'use server';

import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

async function deleteAllFromPath(path: string): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const dataRef = db.ref(path);
    await dataRef.remove();
    return { success: true, message: `All data from "${path}" has been cleared.` };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error(`Error clearing path ${path}:`, error);
    return { success: false, message: `Failed to clear "${path}": ${errorMessage}` };
  }
}

export async function deleteAllProducts(): Promise<{ success: boolean; message: string }> {
  const result = await deleteAllFromPath('products');
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function deleteAllOrders(): Promise<{ success: boolean; message: string }> {
  const result1 = await deleteAllFromPath('orders');
  const result2 = await deleteAllFromPath('all_orders');
  if (result1.success && result2.success) {
    revalidatePath('/my-orders');
    revalidatePath('/dashboard');
    return { success: true, message: 'All order data has been cleared.' };
  }
  return { 
      success: false, 
      message: `Failed to clear all order data. User orders: ${result1.message}. Global orders: ${result2.message}` 
  };
}

export async function deleteAllMessages(): Promise<{ success: boolean; message: string }> {
  const result = await deleteAllFromPath('messages');
  if (result.success) {
    revalidatePath('/dashboard/manage-messages');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function deleteAllReturnRequests(): Promise<{ success: boolean; message: string }> {
    const result = await deleteAllFromPath('return_requests');
    if (result.success) {
        revalidatePath('/dashboard/manage-returns');
        revalidatePath('/dashboard');
    }
    return result;
}
