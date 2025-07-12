
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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

    const authStateUnsubscribe = onAuthStateChanged(auth, (fbUser) => {
      // First, cancel any existing database listener
      if (databaseSubscription) {
        off(ref(db!, `users/${firebaseUser?.uid}`), 'value', databaseSubscription);
        databaseSubscription = undefined;
      }
      
      setFirebaseUser(fbUser);

      if (fbUser) {
        // If user is logged in, fetch their profile from the database.
        if (db) {
            const userProfileRef = ref(db, `users/${fbUser.uid}`);
            databaseSubscription = onValue(userProfileRef, (snapshot) => {
                const userProfile = snapshot.val();
                setUser(userProfile ? { id: fbUser.uid, ...userProfile } : null);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                setUser(null);
                setLoading(false);
            });
        } else {
             // If DB is not configured, we can't fetch a profile.
             setUser(null);
             setLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    return () => {
        authStateUnsubscribe();
        if (databaseSubscription && firebaseUser && db) {
            off(ref(db, `users/${firebaseUser.uid}`), 'value', databaseSubscription);
        }
    };
  }, [firebaseUser]);

  const logout = async () => {
    if (auth) {
      await auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      // Full page refresh after logout to ensure all server state is cleared
      window.location.href = '/login';
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
