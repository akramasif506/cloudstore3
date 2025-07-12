
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

    const authSubscription = onAuthStateChanged(auth, (fbUser) => {
      // If a database listener exists, tear it down.
      if (databaseSubscription) {
        databaseSubscription();
        databaseSubscription = undefined;
      }
      
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is logged in. Start loading until we get their profile.
        setLoading(true);
        const userProfileRef = ref(db!, `users/${fbUser.uid}`);
        
        databaseSubscription = onValue(userProfileRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.val() as AppUser);
          } else {
            // User exists in auth but not in DB. This is an inconsistent state.
            // Log them out of the app state.
            setUser(null);
            console.warn("User authenticated with Firebase but no database profile found.");
          }
          // We have a definitive answer (or lack thereof), so we're done loading.
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });
      } else {
        // User is logged out. Clear app state and stop loading.
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the main effect
    return () => {
        authSubscription();
        if (databaseSubscription) {
            databaseSubscription();
        }
    };
  }, []);

  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle clearing user state and db listeners.
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
