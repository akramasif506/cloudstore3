
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
    let dbUnsubscribe: Unsubscribe | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      
      // If the user logs out, clear profile and stop listening
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }

      if (fbUser) {
        // User is logged in, fetch their profile
        if (db) {
          const userProfileRef = ref(db, `users/${fbUser.uid}`);
          dbUnsubscribe = onValue(
            userProfileRef,
            (snapshot) => {
              const userProfile = snapshot.val();
              if (userProfile) {
                setUser({ id: fbUser.uid, ...userProfile });
              } else {
                // Handle case where user exists in Auth but not DB
                setUser(null); 
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching user profile:", error);
              setUser(null);
              setLoading(false);
            }
          );
        } else {
            // DB not ready
            setUser(null);
            setLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the auth subscription
    return () => {
      authUnsubscribe();
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }
    };
  }, []);


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
