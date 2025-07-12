// src/app/cart/actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set, push } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '@/context/cart-context';

const placeOrderSchema = z.object({
  userId: z.string(),
  items: z.array(z.any()), // Not strictly validating cart items from client
  total: z.number(),
  shippingAddress: z.string().min(10, 'Shipping address is required.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
});

export async function placeOrder(values: {
    userId: string;
    items: CartItem[];
    total: number;
    shippingAddress: string;
    contactNumber: string;
}): Promise<{ success: boolean; orderId?: string; message?: string }> {
  if (!db) {
    return { success: false, message: 'Firebase database is not configured.' };
  }

  const validatedFields = placeOrderSchema.safeParse(values);
  if (!validatedFields.success) {
      return { success: false, message: 'Invalid order data.' };
  }

  const { userId, items, total, shippingAddress, contactNumber } = validatedFields.data;
  const orderId = uuidv4();

  const orderData = {
    id: orderId,
    userId,
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
    status: 'Pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const ordersRef = ref(db, `orders/${orderId}`);
    await set(ordersRef, orderData);
    console.log(`Order ${orderId} saved to Firebase.`);
    return { success: true, orderId };
  } catch (error) {
    console.error('Error saving order to Firebase:', error);
    return { success: false, message: 'Failed to place order.' };
  }
}
