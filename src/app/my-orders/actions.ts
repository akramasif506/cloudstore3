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
    const userOrdersQuery = ordersRef.orderByChild('userId').equalTo(userId);
    const snapshot = await userOrdersQuery.once('value');
    
    if (snapshot.exists()) {
        const ordersData = snapshot.val();
        return Object.keys(ordersData)
            .map(key => ({ ...ordersData[key], id: key }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
    }
    return [];
  } catch (error) {
    console.error("Error fetching user orders from Firebase:", error);
    // This could be a verification error or a database error
    return [];
  }
}
