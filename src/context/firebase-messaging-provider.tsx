// src/context/firebase-messaging-provider.tsx
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { ref, set, push, query, orderByValue, equalTo, get } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

export function FirebaseMessagingProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !app || !db) {
      return;
    }

    const messaging = getMessaging(app);

    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Message received in foreground.', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    const requestPermissionAndGetToken = async () => {
      try {
        if (Notification.permission === 'denied') {
          console.log('Notification permission has been blocked.');
          return;
        }
        
        if (Notification.permission === 'default') {
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
          // Save the token to a flat list in the Realtime Database
          const tokensRef = ref(db, 'fcm_tokens');
          const tokenQuery = query(tokensRef, orderByValue(), equalTo(currentToken));
          const snapshot = await get(tokenQuery);

          if (!snapshot.exists()) {
            const newTokenRef = push(tokensRef);
            await set(newTokenRef, currentToken);
            console.log('New FCM token saved.');
          } else {
            console.log('FCM token already exists.');
          }

        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };
    
    requestPermissionAndGetToken();
    
    return () => {
      unsubscribeOnMessage();
    };

  }, [toast]);

  return <>{children}</>;
}
