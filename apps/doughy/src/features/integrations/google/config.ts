// src/features/integrations/google/config.ts
// Google OAuth configuration and helpers

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';
export const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || '';

// OAuth timeout in milliseconds (60 seconds)
export const OAUTH_TIMEOUT_MS = 60000;

// Token expiration buffer (refresh 5 minutes before expiry)
export const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

// OAuth scopes for Google services
export const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
];

// Google OAuth discovery document
export const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Get the appropriate client ID for the current platform
export function getClientId(): string {
  if (Platform.OS === 'ios' && GOOGLE_CLIENT_ID_IOS) {
    return GOOGLE_CLIENT_ID_IOS;
  }
  if (Platform.OS === 'android' && GOOGLE_CLIENT_ID_ANDROID) {
    return GOOGLE_CLIENT_ID_ANDROID;
  }
  return GOOGLE_CLIENT_ID;
}

// Create redirect URI
export function getRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'doughy',
    path: 'oauth/google',
  });
}

// Check if token is expired or about to expire
export function isTokenExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();
  return expiry - now < TOKEN_EXPIRY_BUFFER_MS;
}

// Create a timeout promise
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}
