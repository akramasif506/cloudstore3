

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
