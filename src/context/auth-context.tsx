
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, Unsubscribe } from 'firebase/database';
import { auth, db } from '@/lib/firebase';
import type { User as AppUser } from '@/lib/types';
import { getSellerSettings, type SellerSettings } from '@/app/dashboard/seller-settings/actions';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to clear cart data from localStorage
function clearCartData() {
    try {
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartSelections');
    } catch (error) {
        console.error("Could not clear cart data from localStorage", error);
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dbUnsubscribe: Unsubscribe | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (newFirebaseUser) => {
      // Check if the user has changed (login/logout)
      if (newFirebaseUser?.uid !== firebaseUser?.uid) {
        clearCartData();
      }
      
      setFirebaseUser(newFirebaseUser);
      
      // If the user logs out, clear profile and stop listening
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }

      if (newFirebaseUser) {
        // User is logged in, fetch their profile and seller settings
        if (db) {
          const userProfileRef = ref(db, `users/${newFirebaseUser.uid}`);
          dbUnsubscribe = onValue(
            userProfileRef,
            async (snapshot) => {
              const userProfile = snapshot.val();
              if (userProfile) {
                // Fetch seller settings to augment user profile
                const sellerSettings = await getSellerSettings();
                setUser({ 
                    id: newFirebaseUser.uid,
                    ...userProfile,
                    sellerSettings, // Attach settings to user object
                });
              } else {
                // Handle case where user exists in Auth but not DB
                setUser(null); 
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching user profile:", error);
              setUser(null);
              setLoading(false);
            }
          );
        } else {
            // DB not ready
            setUser(null);
            setLoading(false);
        }
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function for the auth subscription
    return () => {
      authUnsubscribe();
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }
    };
  }, [firebaseUser?.uid]); // Add firebaseUser.uid to dependency array to correctly detect changes


  const logout = async () => {
    if (auth) {
      await auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      // The onAuthStateChanged listener will handle clearing cart data.
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
