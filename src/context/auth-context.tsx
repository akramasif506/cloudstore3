
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
      // First, clean up any existing database listener
      if (databaseSubscription) {
        off(ref(db!, `users/${firebaseUser?.uid}`), 'value', databaseSubscription);
        databaseSubscription = undefined;
      }

      setFirebaseUser(fbUser);

      if (fbUser) {
        // Keep loading true until we get the profile
        if (!user) setLoading(true);
        const userProfileRef = ref(db!, `users/${fbUser.uid}`);
        
        // Set up the new database listener
        databaseSubscription = onValue(userProfileRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.val() as AppUser);
          } else {
            // User exists in Auth, but not in DB (could be mid-registration).
            // Treat as not fully logged in from an app perspective.
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
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for when the AuthProvider unmounts
    return () => {
        authSubscription();
        if (databaseSubscription && firebaseUser) {
            off(ref(db!, `users/${firebaseUser.uid}`), 'value', databaseSubscription);
        }
    };
    // The dependency array should be empty to run this effect only once on mount.
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
