
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, Unsubscribe } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let databaseSubscription: Unsubscribe | undefined;

    const authStateUnsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      // If there's an old DB listener, turn it off.
      if (databaseSubscription) {
        databaseSubscription();
        databaseSubscription = undefined;
      }
      
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is signed in. Create server session cookie.
        const idToken = await fbUser.getIdToken();
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
        });

        // Listen for their profile data from Realtime Database.
        if (db) {
            const userProfileRef = ref(db, `users/${fbUser.uid}`);
            databaseSubscription = onValue(userProfileRef, (snapshot) => {
                setUser(snapshot.exists() ? snapshot.val() : null);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUser(null);
                setLoading(false);
            });
        } else {
            // DB not configured
             setUser(null);
             setLoading(false);
        }
      } else {
        // User is signed out. Clear everything.
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on component unmount
    return () => {
        authStateUnsubscribe();
        if (databaseSubscription) {
            databaseSubscription();
        }
    };
  }, []);

  const logout = async () => {
    if (auth) {
      await auth.signOut();
    }
  };
  
  const value = { user, firebaseUser, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
