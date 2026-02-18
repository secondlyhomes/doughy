/**
 * useAppClip.ts
 *
 * React hook for App Clip functionality
 */

import { useEffect, useState } from 'react';
import { AppClipConfig } from './types';
import { AppClipManager } from './AppClipManager';

/**
 * Hook for App Clip functionality
 * Provides App Clip status, configuration, and upgrade prompt
 */
export function useAppClip() {
  const [isAppClip, setIsAppClip] = useState(false);
  const [config, setConfig] = useState<AppClipConfig | null>(null);

  useEffect(() => {
    checkAppClipStatus();
  }, []);

  const checkAppClipStatus = async () => {
    const isClip = AppClipManager.isAppClip();
    setIsAppClip(isClip);

    if (isClip) {
      const url = await AppClipManager.getInvocationURL();
      if (url) {
        const clipConfig = AppClipManager.parseClipURL(url);
        setConfig(clipConfig);
      }
    }
  };

  const showUpgradePrompt = () => {
    AppClipManager.showUpgradePrompt();
  };

  return {
    isAppClip,
    config,
    showUpgradePrompt,
  };
}
