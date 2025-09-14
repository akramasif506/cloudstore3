

// src/app/cart/actions.ts
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem, FeeConfig, Product, Discount, DiscountMap } from '@/lib/types';
import { ServerValue } from 'firebase-admin/database';
import { getCategories } from '../dashboard/manage-categories/actions';
import type { CategoryMap } from '../dashboard/manage-categories/actions';

const placeOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  customerName: z.string().min(1, 'Customer name is required.'),
  items: z.array(z.any()), // Not strictly validating cart items from client
  shippingAddress: z.string().min(10, 'Shipping address is required.'),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
  pinCode: z.string().optional(),
});

async function getFeeConfigServer(): Promise<FeeConfig> {
    const { db } = initializeAdmin();
    try {
        const feesRef = db.ref('site_config/fees');
        const snapshot = await feesRef.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return { platformFeePercent: 0, handlingFeeFixed: 0 }; // Default if not set
    } catch (error) {
        console.error('Error fetching fee config:', error);
        return { platformFeePercent: 0, handlingFeeFixed: 0 };
    }
}

async function getDiscountsServer(): Promise<DiscountMap> {
  const { db } = initializeAdmin();
  try {
    const discountsRef = db.ref('site_config/location_discounts');
    const snapshot = await discountsRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error('Error fetching discounts config:', error);
  }
  return {};
}

async function getNextOrderId(db: any): Promise<string> {
  const counterRef = db.ref('site_config/order_counter');
  const result = await counterRef.transaction((currentValue: number | null) => {
    if (currentValue === null) {
      return 1001; // Starting value
    }
    return currentValue + 1;
  });

  if (!result.committed) {
    throw new Error('Failed to generate a new order ID. Please try again.');
  }
  
  const newOrderNumber = result.snapshot.val();
  return `CS-${newOrderNumber}`;
}


export async function placeOrder(values: {
    userId: string;
    customerName: string;
    items: CartItem[];
    shippingAddress: string;
    contactNumber: string;
    pinCode?: string;
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

  const { userId, customerName, items, shippingAddress, contactNumber, pinCode } = validatedFields.data;

  // --- Server-side validation for item availability and stock ---
  try {
    const itemIds = items.map(item => item.id);
    const productRefs = itemIds.map(id => db.ref(`products/${id}`));
    const productSnapshots = await Promise.all(productRefs.map(ref => ref.once('value')));
    
    const unavailableItems: string[] = [];
    for (let i = 0; i < productSnapshots.length; i++) {
        const snapshot = productSnapshots[i];
        const product = snapshot.val() as Product;
        const cartItem = items[i];

        if (!product || product.status !== 'active') {
            unavailableItems.push(`${cartItem.name} (no longer available)`);
        } else if (product.stock !== undefined && product.stock < cartItem.quantity) {
            unavailableItems.push(`${cartItem.name} (only ${product.stock} in stock)`);
        }
    }


    if (unavailableItems.length > 0) {
      const message = `Some items are no longer available or have insufficient stock: ${unavailableItems.join(', ')}. Please adjust your cart.`;
      return { success: false, message: message };
    }
  } catch (error) {
    console.error('Error validating product status:', error);
    return { success: false, message: 'Could not verify items in your cart. Please try again.' };
  }
  // ---

  // --- Recalculate total on the server ---
  const [feeConfig, discounts, categories] = await Promise.all([
    getFeeConfigServer(), 
    getDiscountsServer(),
    getCategories()
  ]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = subtotal * (feeConfig.platformFeePercent / 100);
  const handlingFee = feeConfig.handlingFeeFixed;
  
  // --- Calculate Tax ---
  const totalTax = items.reduce((sum, item) => {
    const category = categories[item.category];
    let taxPercent = category?.taxPercent || 0;
    
    const subcategory = category?.subcategories.find(sub => sub.name === item.subcategory);
    if (subcategory && subcategory.taxPercent) {
        taxPercent = subcategory.taxPercent;
    }
    
    const itemTax = (item.price * item.quantity) * (taxPercent / 100);
    return sum + itemTax;
  }, 0);


  // --- Calculate Discount ---
  let appliedDiscount: { name: string, value: number } | null = null;
  let bestDiscount = 0;
  
  if (pinCode) {
    Object.values(discounts).forEach(discountRule => {
        if (discountRule.enabled && discountRule.pincodes.includes(pinCode)) {
            let currentDiscountValue = 0;
            if (discountRule.type === 'percentage') {
                currentDiscountValue = subtotal * (discountRule.value / 100);
            } else { // 'fixed'
                currentDiscountValue = discountRule.value;
            }
            if (currentDiscountValue > bestDiscount) {
                bestDiscount = currentDiscountValue;
                appliedDiscount = { name: discountRule.name, value: bestDiscount };
            }
        }
    });
  }
  // Ensure discount does not exceed subtotal
  if (bestDiscount > subtotal) {
      bestDiscount = subtotal;
      if(appliedDiscount) appliedDiscount.value = subtotal;
  }
  
  const total = subtotal + platformFee + handlingFee + totalTax - bestDiscount;
  // ---

  try {
    const orderId = await getNextOrderId(db);
    const internalId = uuidv4(); // Still use UUID for internal unique key

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
          category: item.category,
          subcategory: item.subcategory,
          seller: {
              id: item.seller?.id || 'unknown',
              name: item.seller?.name || 'CloudStore',
              contactNumber: item.seller?.contactNumber || 'N/A'
          }
      })),
      subtotal,
      platformFee,
      handlingFee,
      tax: totalTax,
      discount: appliedDiscount, // Save the discount info
      total,
      shippingAddress,
      pinCode,
      contactNumber,
      status: 'Pending' as const,
      createdAt: new Date().toISOString(),
    };

    // --- Create updates for multiple paths ---
    const updates: { [key: string]: any } = {};

    // 1. Store the order under the user's ID
    updates[`orders/${userId}/${internalId}`] = orderData;
    // 2. Store a copy for direct lookup by admins
    updates[`all_orders/${internalId}`] = orderData;

    // 3. Decrement stock for each product
    for (const item of items) {
        const productRef = db.ref(`products/${item.id}`);
        const snapshot = await productRef.once('value');
        const product = snapshot.val() as Product;

        if (product && product.stock !== undefined) {
            const newStock = product.stock - item.quantity;
            updates[`products/${item.id}/stock`] = newStock;
            // If stock is 0, also update status to 'sold'
            if (newStock <= 0) {
                updates[`products/${item.id}/status`] = 'sold';
            }
        }
    }
    
    // --- Atomically write all updates ---
    await db.ref().update(updates);

    return { success: true, orderId: internalId };

  } catch (error) {
    console.error('Error saving order to Firebase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to place order.';
    return { success: false, message: errorMessage };
  }
}
