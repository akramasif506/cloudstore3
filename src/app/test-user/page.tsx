// src/app/test-user/page.tsx
import { db } from '@/lib/firebase';
import { get, ref } from 'firebase/database';
import { getCurrentUser } from '@/lib/auth';
import { TestUserClient } from './test-user-client';

async function getUserProfile(userId: string) {
    if (!db) {
        return { success: false, message: "Firebase Database is not configured.", data: null };
    }
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return { success: true, message: "User profile found.", data: snapshot.val() };
        } else {
            return { success: false, message: `No profile found in database at path: users/${userId}`, data: null };
        }
    } catch (error: any) {
        return { success: false, message: `Database read error: ${error.message}`, data: null };
    }
}

export default async function TestUserPage() {
    const user = await getCurrentUser();

    let profileResult = null;

    if (user) {
        profileResult = await getUserProfile(user.uid);
    }

    return <TestUserClient user={user} profileResult={profileResult} />;
}
