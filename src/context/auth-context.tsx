
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
      // If the user signs out, fbUser will be null.
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
      // If the user signs in, the effect below will handle profile fetching and loading state.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect runs when `firebaseUser` changes.
    if (firebaseUser) {
        // Don't set loading to false yet. We need the profile.
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        const unsubscribeDb = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val() as AppUser);
            } else {
                console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
                setUser(null); 
            }
            // Now that we have the profile (or know it doesn't exist), loading is complete.
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });

        // Cleanup the database listener
        return () => off(userRef, 'value', unsubscribeDb);
    } else {
        // When there is no firebaseUser (initially or after logout),
        // the onAuthStateChanged listener handles setting loading to false.
    }
  }, [firebaseUser]);


  const logout = async () => {
    if (auth) {
      // Set user to null immediately for a faster UI response
      setUser(null); 
      await auth.signOut();
      // onAuthStateChanged will also fire to confirm, but this improves UX.
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
