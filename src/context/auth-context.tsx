
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
    if (!auth) {
      console.warn("Firebase Auth not configured. Auth services disabled.");
      setLoading(false);
      return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
      // If user is signed in, the next effect will handle profile fetching.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) {
        // No user logged in, or DB not configured.
        if (!firebaseUser) setLoading(false);
        return;
    }

    setLoading(true);
    const userRef = ref(db, `users/${firebaseUser.uid}`);
    
    const unsubscribeDb = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUser(snapshot.val() as AppUser);
      } else {
        console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
        setUser(null); 
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setLoading(false);
    });

    // Cleanup the database listener when the user changes or component unmounts
    return () => off(userRef, 'value', unsubscribeDb);

  }, [firebaseUser]);


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // State updates will be triggered by onAuthStateChanged
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
