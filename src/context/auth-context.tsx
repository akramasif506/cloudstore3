
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
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      // The loading state will be managed by the database listener effect.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    setLoading(true); // Start loading whenever the firebaseUser changes.
    if (firebaseUser) {
        if (!db) {
            console.warn("Firebase DB not configured. Cannot fetch user profile.");
            setUser(null);
            setLoading(false);
            return;
        }
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        const onValueChange = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val() as AppUser);
            } else {
                console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
                setUser(null); 
            }
            setLoading(false); // Final step, loading is complete.
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false); // Stop loading on error.
        });

        return () => off(userRef, 'value', onValueChange);
    } else {
      // No firebaseUser, so we are not logged in.
      setUser(null);
      setLoading(false);
    }
  }, [firebaseUser]);


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle setting user to null.
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
