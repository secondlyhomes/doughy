/**
 * types.ts
 *
 * Type definitions for iOS App Clips
 */

/**
 * App Clip invocation types - how the App Clip was launched
 */
export enum AppClipInvocationType {
  QRCode = 'qr_code',
  NFCTag = 'nfc_tag',
  SafariBanner = 'safari_banner',
  Messages = 'messages',
  Maps = 'maps',
  Unknown = 'unknown',
}

/**
 * App Clip configuration parsed from invocation URL
 */
export interface AppClipConfig {
  url: string;
  invocationType: AppClipInvocationType;
  metadata?: Record<string, any>;
}

/**
 * Props for content components that receive metadata
 */
export interface ClipContentProps {
  metadata?: Record<string, any>;
}
