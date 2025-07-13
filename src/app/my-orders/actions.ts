

'use server';

import type { Order } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

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

    const ordersRef = db.ref('orders');
    // Fetch all orders and filter on the server-side.
    // This avoids needing a database index for the query.
    const snapshot = await ordersRef.once('value');
    
    if (snapshot.exists()) {
        const ordersData = snapshot.val();
        const allOrders: Order[] = Object.keys(ordersData).map(key => ({ ...ordersData[key], id: key }));

        // Filter for the current user's orders
        const userOrders = allOrders.filter(order => order.userId === userId);

        // Sort by creation date, newest first
        return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching user orders from Firebase:", error);
    // This could be a verification error or a database error
    return [];
  }
}
