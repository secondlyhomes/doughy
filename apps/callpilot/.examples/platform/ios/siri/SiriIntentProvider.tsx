/**
 * SiriIntentProvider.tsx
 *
 * React component for providing Siri intent handling context
 */

import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { IntentHandlerManager } from './IntentHandlerManager';

interface SiriIntentProviderProps {
  children: React.ReactNode;
}

/**
 * Component for handling Siri intents
 */
export function SiriIntentProvider({ children }: SiriIntentProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    IntentHandlerManager.initialize();
    setIsReady(true);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[Siri] App became active, checking for intents');
      }
    });

    return () => {
      subscription.remove();
      IntentHandlerManager.cleanup();
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Example usage component
 */
export function ExampleSiriIntentScreen() {
  // Import useSiriIntentHandler from './useSiriIntentHandler' to use
  // const { lastIntent } = useSiriIntentHandler();

  return (
    <>
      {/* Display last intent info here */}
    </>
  );
}
