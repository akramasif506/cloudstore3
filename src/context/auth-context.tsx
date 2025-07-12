
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
      // If there's no user, we can stop loading immediately.
      if (!currentFirebaseUser) {
        setUser(null);
        setLoading(false);
      }
      // If there IS a user, the loading state will be managed by the database listener effect below.
      // We keep `loading` as true until the profile is fetched.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // This effect runs when `firebaseUser` is determined by the auth listener.
    if (firebaseUser) {
        if (!db) {
            console.warn("Firebase DB not configured. Cannot fetch user profile.");
            setUser(null);
            setLoading(false);
            return;
        }
        
        // We are logged in with Firebase Auth, but we need the profile from the database.
        // Keep loading until this is done.
        setLoading(true); 
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        const onValueChange = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUser(snapshot.val() as AppUser);
            } else {
                console.warn(`User profile for UID ${firebaseUser.uid} not found in database.`);
                setUser(null); 
            }
            setLoading(false); // Profile loaded (or not found), stop loading.
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false); // Stop loading on error.
        });

        // Cleanup the listener when the component unmounts or firebaseUser changes.
        return () => off(userRef, 'value', onValueChange);
    } else {
      // This case handles the initial state and logout.
      // The auth listener already sets user to null and loading to false.
      // So no extra action is needed here unless there's a quick state change.
      setUser(null);
      setLoading(false);
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
