
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in, get their full profile from Realtime DB
        const userRef = ref(db, `users/${fbUser.uid}`);
        
        const fetchUserProfile = (retry = true) => {
           onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              setUser(userData as AppUser);
              setLoading(false);
            } else {
               if (retry) {
                // This handles a race condition during registration where the auth state
                // might be known before the database write has completed.
                // We'll wait a bit and try one more time.
                setTimeout(() => fetchUserProfile(false), 1000);
              } else {
                // If it still doesn't exist, the user has an auth record but no
                // profile in the DB, so we treat them as not fully logged in.
                console.warn(`User with UID ${fbUser.uid} found in Auth, but not in Realtime Database.`);
                setUser(null);
                setLoading(false);
              }
            }
          }, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
          });
        }
        
        fetchUserProfile();

        // The onAuthStateChanged listener only needs to set up the onValue listener once.
        // Returning the `off` function from onValue will handle cleanup when the component unmounts.
        return () => off(userRef);

      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the auth state change listener
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    if(auth) {
        await auth.signOut();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>
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
