
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
        // User is signed in, get their profile from Realtime DB
        const userRef = ref(db, `users/${fbUser.uid}`);
        const listener = onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUser({
              ...userData,
              // Ensure we have the latest photoURL from auth, as it's the source of truth
              profileImageUrl: fbUser.photoURL || userData.profileImageUrl,
            } as AppUser);
          } else {
            // This might happen if user record creation fails after auth creation
             setUser({
              id: fbUser.uid,
              name: fbUser.displayName || 'User',
              email: fbUser.email || '',
              profileImageUrl: fbUser.photoURL || `https://placehold.co/100x100`,
              createdAt: new Date().toISOString(),
            });
          }
          setLoading(false);
        });
        return () => off(userRef, 'value', listener);
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

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
