// src/app/cart/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '@/context/cart-context';

const placeOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  customerName: z.string().min(1, 'Customer name is required.'),
  items: z.array(z.any()), // Not strictly validating cart items from client
  total: z.number(),
  shippingAddress: z.string().min(10, 'Shipping address is required.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
});

export async function placeOrder(values: {
    userId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    shippingAddress: string;
    contactNumber: string;
}): Promise<{ success: boolean; orderId?: string; message?: string }> {
  
  let db;
  try {
    ({ db } = initializeAdmin());
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

  const validatedFields = placeOrderSchema.safeParse(values);
  if (!validatedFields.success) {
      return { success: false, message: 'Invalid order data.' };
  }

  const { userId, customerName, items, total, shippingAddress, contactNumber } = validatedFields.data;
  const orderId = uuidv4();

  const orderData = {
    id: orderId,
    userId,
    customerName,
    items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
    })),
    total,
    shippingAddress,
    contactNumber,
    status: 'Pending' as const,
    createdAt: new Date().toISOString(),
  };

  try {
    // Store the order under the user's ID for efficient retrieval
    const userOrderRef = db.ref(`orders/${userId}/${orderId}`);
    await userOrderRef.set(orderData);
    
    // Also store a copy for direct lookup by admins or for the order detail page
    const globalOrderRef = db.ref(`all_orders/${orderId}`);
    await globalOrderRef.set(orderData);

    console.log(`Order ${orderId} saved for user ${userId} and globally.`);
    return { success: true, orderId };
  } catch (error) {
    console.error('Error saving order to Firebase:', error);
    return { success: false, message: 'Failed to place order.' };
  }
}
