
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
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
    if (!auth || !db) {
      console.warn("Firebase not configured. Auth services disabled.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setLoading(true); // Start loading whenever auth state might change
      setFirebaseUser(fbUser);
      if (!fbUser) {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
      // If user is logged in, the other useEffect will handle profile fetching.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      // User is authenticated, now fetch their profile from the database
      const userRef = ref(db!, `users/${firebaseUser.uid}`);
      
      const onProfileValue = (snapshot: any) => {
        if (snapshot.exists()) {
          setUser(snapshot.val() as AppUser);
        } else {
          console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
          setUser(null); // Explicitly set user to null if profile doesn't exist
        }
        setLoading(false); // Stop loading once profile is fetched (or not found)
      };

      // Listen for profile data
      onValue(userRef, onProfileValue);

      // Cleanup function to detach the listener when the user logs out
      return () => {
        off(userRef, 'value', onProfileValue);
      };

    } else {
      // No firebase user, so no profile to fetch.
      // The onAuthStateChanged handles this case already, but this is a safeguard.
      if (loading) {
        setLoading(false);
      }
    }
  }, [firebaseUser]);


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle setting user to null and updating state.
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
