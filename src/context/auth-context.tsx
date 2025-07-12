
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
      if (databaseSubscription) {
        databaseSubscription();
        databaseSubscription = undefined;
      }
      
      setFirebaseUser(fbUser);

      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (db) {
            const userProfileRef = ref(db, `users/${fbUser.uid}`);
            databaseSubscription = onValue(userProfileRef, (snapshot) => {
                setUser(snapshot.exists() ? snapshot.val() : null);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUser(null);
                setLoading(false); // Ensure loading is false on error
            });
        } else {
             setUser(null);
             setLoading(false); // Ensure loading is false if DB is not configured
        }
      } else {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setFirebaseUser(null);
        setLoading(false); // Ensure loading is false when user is logged out
      }
    });

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
