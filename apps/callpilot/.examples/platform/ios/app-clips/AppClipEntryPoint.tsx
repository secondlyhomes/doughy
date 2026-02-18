/**
 * AppClipEntryPoint.tsx
 *
 * iOS App Clips Entry Point Component
 *
 * App Clips are lightweight versions of your app (<15MB) that load instantly
 * from NFC tags, QR codes, Safari App Banners, or Messages.
 *
 * Features:
 * - Instant launch without installation
 * - Quick actions (order, book, pay)
 * - Upgrade to full app
 * - Location-based invocation
 *
 * Requirements:
 * - iOS 14+
 * - Separate App Clip target in Xcode
 * - Under 15MB size limit
 * - Associated domains
 *
 * Related docs:
 * - .examples/platform/ios/app-clips/README.md
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Button, Linking } from 'react-native';
import { AppClipConfig } from './types';
import { AppClipManager } from './AppClipManager';
import { AppClipContent } from './AppClipContent';
import { styles } from './styles';

/**
 * App Clip Entry Point Component
 * Main component for App Clip experience
 */
export function AppClipEntryPoint() {
  const [config, setConfig] = useState<AppClipConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAppClipConfig();
  }, []);

  const loadAppClipConfig = async () => {
    try {
      const url = await AppClipManager.getInvocationURL();

      if (url) {
        const clipConfig = AppClipManager.parseClipURL(url);
        setConfig(clipConfig);
      }
    } catch (error) {
      console.error('[AppClip] Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    const appStoreURL = AppClipManager.getFullAppURL();
    Linking.openURL(appStoreURL);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load App Clip</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to App Clip</Text>

      <Text style={styles.subtitle}>
        Quick access without downloading the full app
      </Text>

      {/* Main App Clip content based on invocation */}
      <AppClipContent config={config} />

      {/* Upgrade prompt */}
      <View style={styles.upgradeSection}>
        <Text style={styles.upgradeText}>
          Get the full experience with the complete app
        </Text>
        <Button title="Download Full App" onPress={handleUpgrade} />
      </View>
    </View>
  );
}
