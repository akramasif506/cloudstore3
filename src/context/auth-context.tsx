
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
    
    // This listener handles the initial auth state check and any subsequent changes (login/logout).
    const unsubscribeAuth = onAuthStateChanged(auth, (currentFirebaseUser) => {
      setLoading(true); // Always set loading to true when auth state might be changing.
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        // The profile fetching will happen in the next effect, which will set loading to false.
      } else {
        // User is logged out.
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect is dedicated to fetching the user profile from the database when a firebaseUser exists.
    if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        const unsubscribeDb = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val() as AppUser);
            } else {
                console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
                setUser(null); 
            }
            // Critical: Set loading to false only after we have the profile data (or know it's missing).
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });

        // Cleanup the database listener when the component unmounts or firebaseUser changes.
        return () => off(userRef, 'value', unsubscribeDb);
    }
    // If firebaseUser is null, the onAuthStateChanged listener has already set loading to false.
  }, [firebaseUser]);


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle setting user to null and loading to false.
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
