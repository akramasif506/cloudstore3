
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  userLoaded: boolean; // Tracks if the user's DB profile has been loaded
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true); // Tracks Firebase Auth state
  const [userLoaded, setUserLoaded] = useState(false); // Tracks if DB profile is loaded

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const userRef = ref(db, `users/${fbUser.uid}`);
        
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser(userData as AppUser);
            setUserLoaded(true); // DB profile is loaded
            setLoading(false);
          } else {
            // This handles a race condition during registration. We'll wait a bit.
            setTimeout(() => {
              onValue(userRef, (snapshotRetry) => {
                if(snapshotRetry.exists()) {
                   setUser(snapshotRetry.val() as AppUser);
                } else {
                   console.warn(`User with UID ${fbUser.uid} not in DB.`);
                   setUser(null);
                }
                setUserLoaded(true);
                setLoading(false);
              })
            }, 1200);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUser(null);
          setUserLoaded(true);
          setLoading(false);
        });

        return () => off(userRef);

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
        setUserLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if(auth) {
        setUser(null);
        setUserLoaded(false);
        await auth.signOut();
    }
  };

  // Show a global loader until both Firebase Auth and the user profile are checked.
  if (loading || !userLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, userLoaded, logout }}>
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
