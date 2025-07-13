// src/context/firebase-messaging-provider.tsx
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { ref, set, push, query, orderByValue, equalTo, get } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

export function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !app || !db) {
      return;
    }

    const messaging = getMessaging(app);

    // Handle messages while app is in foreground
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Message received in foreground.', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    const requestPermissionAndGetToken = async () => {
      if (!user) return; // Only run if user is logged in

      try {
        // Check current permission status
        if (Notification.permission === 'denied') {
          console.log('Notification permission has been blocked.');
          return; // Stop execution if permission is denied
        }
        
        if (Notification.permission === 'default') {
          console.log('Requesting notification permission...');
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Unable to get permission to notify.');
            return;
          }
        }

        // Permission is granted, now get the token
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          // Save the token to the Realtime Database, but only if it's not already there for this user
          const userTokensRef = ref(db, `fcm_tokens/${user.id}`);
          const tokenQuery = query(userTokensRef, orderByValue(), equalTo(currentToken));
          const snapshot = await get(tokenQuery);

          if (!snapshot.exists()) {
            const newTokenRef = push(userTokensRef);
            await set(newTokenRef, currentToken);
            console.log('New FCM token saved for user:', user.id);
          } else {
            console.log('FCM token already exists for user:', user.id);
          }

        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };
    
    requestPermissionAndGetToken();
    
    // Cleanup
    return () => {
      unsubscribeOnMessage();
    };

  }, [user, toast]);

  return <>{children}</>;
}
