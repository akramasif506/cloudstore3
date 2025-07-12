
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, DatabaseReference, Unsubscribe } from 'firebase/database';
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
    let unsubscribeDb: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      // Always unsubscribe from any previous database listener first
      if (unsubscribeDb) {
        unsubscribeDb();
      }

      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is logged in, set up a new listener for their profile
        setLoading(true);
        const userProfileRef = ref(db!, `users/${fbUser.uid}`);
        
        unsubscribeDb = onValue(userProfileRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.val() as AppUser);
          } else {
            // User exists in auth but not in DB, treat as not fully logged in
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup the auth subscription and any lingering db subscription on component unmount
    return () => {
        unsubscribeAuth();
        if (unsubscribeDb) {
            unsubscribeDb();
        }
    };
  }, []);

  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle clearing user state and db listeners
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
