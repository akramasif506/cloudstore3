
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
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
    let userProfileListener: DatabaseReference | null = null;
    let onProfileValue: ((snapshot: any) => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      // First, always clean up the previous listener if it exists
      if (userProfileListener && onProfileValue) {
        off(userProfileListener, 'value', onProfileValue);
      }
      
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is logged in, set up a new listener for their profile
        setLoading(true);
        userProfileListener = ref(db!, `users/${fbUser.uid}`);
        
        onProfileValue = (snapshot: any) => {
          if (snapshot.exists()) {
            setUser(snapshot.val() as AppUser);
          } else {
            // This can happen if the db entry isn't created yet or was deleted
            setUser(null);
          }
          setLoading(false);
        };
        onValue(userProfileListener, onProfileValue, (error) => {
            console.error("Error fetching user profile:", error);
            setUser(null);
            setLoading(false);
        });

      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup the auth subscription on component unmount
    return () => {
        unsubscribeAuth();
        if (userProfileListener && onProfileValue) {
            off(userProfile_listener, 'value', onProfileValue);
        }
    };
  }, []);


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      // onAuthStateChanged will handle clearing user state
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
