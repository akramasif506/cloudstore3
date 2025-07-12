
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
    
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is logged in, but we still need their profile.
        // Keep loading until the profile is fetched.
        if (!loading) setLoading(true);
        const userRef = ref(db!, `users/${fbUser.uid}`);
        
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val() as AppUser);
            } else {
                console.warn(`User profile for UID ${fbUser.uid} not found in database.`);
                setUser(null); // Or handle as an incomplete profile
            }
            setLoading(false);
        }, {
          onlyOnce: true
        });

      } else {
        // User is logged out.
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
