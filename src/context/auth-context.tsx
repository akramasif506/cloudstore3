
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
      setLoading(true);
      if (currentFirebaseUser) {
        setFirebaseUser(currentFirebaseUser);
        // DB fetch will be triggered by the other effect. Loading will be set to false there.
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false); // No user, so loading is complete.
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect handles fetching the user profile from the database.
    if (firebaseUser) {
        if (!db) {
            console.warn("Firebase DB not configured. Cannot fetch user profile.");
            setUser(null);
            setLoading(false); // Stop loading if DB is not available.
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
            // This is the final step, so now we can set loading to false.
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false); // Stop loading on error.
        });

        // Cleanup the database listener when the firebaseUser changes or component unmounts.
        return () => off(userRef, 'value', onValueChange);
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
