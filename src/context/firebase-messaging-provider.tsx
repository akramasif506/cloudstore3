// src/context/firebase-messaging-provider.tsx
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { useAuth } from './auth-context';
import { ref, set, push } from 'firebase/database';
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
      try {
        if (Notification.permission === 'granted') {
          console.log('Notification permission already granted.');
        } else if (Notification.permission === 'denied') {
          console.log('Notification permission has been blocked.');
          return; // Stop execution if permission is denied
        } else if (Notification.permission === 'default') {
          console.log('Requesting notification permission...');
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Unable to get permission to notify.');
            return;
          }
        }

        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          if (user) {
            // Save the token to the Realtime Database
            const userTokensRef = ref(db, `fcm_tokens/${user.id}`);
            const newTokenRef = push(userTokensRef);
            await set(newTokenRef, currentToken);
            console.log('FCM token saved for user:', user.id);
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };
    
    // We only request permission if a user is logged in
    if (user) {
      requestPermissionAndGetToken();
    }
    
    // Cleanup
    return () => {
      unsubscribeOnMessage();
    };

  }, [user, toast]);

  return <>{children}</>;
}
