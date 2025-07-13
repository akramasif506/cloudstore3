
'use server';

import type { ContactMessage } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function getAllMessages(): Promise<ContactMessage[]> {
  try {
    const { db } = initializeAdmin();
    const messagesRef = db.ref('messages');
    const snapshot = await messagesRef.orderByChild('timestamp').once('value');
    
    if (snapshot.exists()) {
      const messagesData = snapshot.val();
      return Object.keys(messagesData)
        .map(key => ({ ...messagesData[key], id: key }))
        .reverse(); // Newest first
    }
    return [];
  } catch (error) {
    console.error("Error fetching all messages:", error);
    return [];
  }
}
