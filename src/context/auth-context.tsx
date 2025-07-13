
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeFromDb: Unsubscribe | undefined;

    if (firebaseUser) {
      if (db) {
        const userProfileRef = ref(db, `users/${firebaseUser.uid}`);
        unsubscribeFromDb = onValue(
          userProfileRef,
          (snapshot) => {
            const userProfile = snapshot.val();
            setUser(userProfile ? { id: firebaseUser.uid, ...userProfile } : null);
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
          }
        );
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    return () => {
      if (unsubscribeFromDb) {
        unsubscribeFromDb();
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
