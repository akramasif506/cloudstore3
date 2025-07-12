
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

    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      // First, clean up any existing database listener
      if (databaseSubscription) {
        // Use a local variable to capture the current firebaseUser's uid for cleanup
        const uidToUnsubscribe = firebaseUser?.uid;
        if (uidToUnsubscribe) {
            off(ref(db!, `users/${uidToUnsubscribe}`), 'value', databaseSubscription);
        }
        databaseSubscription = undefined;
      }
      
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // User is signed in.
        const idToken = await fbUser.getIdToken();
        // Post the token to the server to create a session cookie
        await fetch('/api/auth', {
            method: 'POST',
            headers: {
            'Authorization': `Bearer ${idToken}`,
            },
        });
        
        // Listen for user profile data from Realtime Database
        const userProfileRef = ref(db!, `users/${fbUser.uid}`);
        databaseSubscription = onValue(userProfileRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.val() as AppUser);
          } else {
            // This can happen if the user is in Auth but not yet in the DB (e.g., during registration)
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });
      } else {
        // User is signed out.
        // Clear session cookie by calling the API
         await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid]); // Add firebaseUser?.uid to dependencies to correctly manage subscription cleanup

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
