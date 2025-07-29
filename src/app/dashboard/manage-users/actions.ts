
'use server';

import type { User } from '@/lib/types';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getAllUsers(searchQuery?: string): Promise<User[]> {
  try {
    const { db } = initializeAdmin();
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      let usersList: User[] = Object.keys(usersData).map(key => ({
        ...usersData[key],
        id: key,
      }));

      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        usersList = usersList.filter(user => 
            user.name.toLowerCase().includes(lowercasedQuery) ||
            user.email.toLowerCase().includes(lowercasedQuery) ||
            user.mobileNumber?.includes(lowercasedQuery)
        );
      }

      return usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<{ success: boolean, message: string }> {
    try {
        const { db } = initializeAdmin();
        const userRef = db.ref(`users/${userId}`);
        
        await userRef.update({ role });
        revalidatePath('/dashboard/manage-users');
        
        return { success: true, message: "User role updated successfully." };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Error updating user role:", error);
        return { success: false, message: `Failed to update role: ${errorMessage}` };
    }
}
