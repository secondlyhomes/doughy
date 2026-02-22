// src/hooks/useAuthDeepLink.ts
// Handles Supabase auth deep links (password reset, email confirmation, magic links)
// Extracts tokens from URL fragment and establishes a session

import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { USE_MOCK_DATA } from '@/lib/supabase';

/**
 * Hook that listens for incoming deep links with Supabase auth tokens.
 *
 * Flow:
 * 1. User clicks password reset / magic link / confirmation email
 * 2. Supabase verifies token, redirects to doughy://reset-password#access_token=...
 * 3. This hook extracts tokens from the URL fragment
 * 4. Calls setSession() to establish the auth session
 * 5. Navigates to the appropriate screen
 *
 * Must be used inside a component that has access to Expo Router navigation.
 */
export function useAuthDeepLink() {
  const router = useRouter();
  const processedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) return;

    const handleUrl = async (url: string) => {
      // Avoid processing the same URL twice
      if (processedUrlRef.current === url) return;
      processedUrlRef.current = url;

      // Only handle doughy:// scheme URLs
      if (!url.startsWith('doughy://')) return;

      // Extract fragment (after #) — implicit flow puts tokens here
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (!accessToken || !refreshToken) return;

      console.log('[auth-deep-link] Processing auth redirect, type:', type);

      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[auth-deep-link] Error setting session:', error.message);
          // Surface expired/invalid token errors to the user
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            Alert.alert(
              'Link Expired',
              'This link has expired. Please request a new one.',
              [{ text: 'OK' }]
            );
          }
          return;
        }

        // Navigate based on the auth event type
        if (type === 'recovery') {
          router.replace('/(auth)/reset-password');
        }
        // signup / email_change → auth state change handles navigation
        // magiclink → session is set, normal authenticated flow kicks in
      } catch (err) {
        console.error('[auth-deep-link] Error handling auth URL:', err);
      }
    };

    // Handle URL that launched the app (cold start)
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleUrl(url);
      })
      .catch((err) => {
        console.error('[auth-deep-link] Error getting initial URL:', err);
      });

    // Handle URLs when the app is already open (warm start)
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, [router]);
}
