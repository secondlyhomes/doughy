/**
 * usePictureInPicture Hook
 *
 * React hooks for Picture-in-Picture functionality
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PictureInPictureManager, pipEmitter } from '../utils/pip-utils';
import type { PiPParams, PiPAction, UsePictureInPictureReturn } from '../types';

/**
 * Main Picture-in-Picture Hook
 */
export function usePictureInPicture(params?: PiPParams): UsePictureInPictureReturn {
  const [isInPipMode, setIsInPipMode] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const listenerId = useRef(`pip-${Date.now()}`).current;

  useEffect(() => {
    // Check support
    PictureInPictureManager.isSupported().then(setIsSupported);

    // Initialize
    PictureInPictureManager.initialize();

    // Listen for PiP mode changes
    PictureInPictureManager.addListener(listenerId, setIsInPipMode);

    return () => {
      PictureInPictureManager.removeListener(listenerId);
    };
  }, [listenerId]);

  const enterPiP = useCallback(
    async (customParams?: PiPParams) => {
      const pipParams = customParams || params;
      if (!pipParams) {
        console.error('PiP params required');
        return { success: false, error: 'PiP params required' };
      }

      return await PictureInPictureManager.enterPiP(pipParams);
    },
    [params]
  );

  const exitPiP = useCallback(async () => {
    await PictureInPictureManager.exitPiP();
  }, []);

  const updatePiP = useCallback(async (updates: Partial<PiPParams>) => {
    await PictureInPictureManager.updatePiP(updates);
  }, []);

  return {
    isInPipMode,
    isSupported,
    enterPiP,
    exitPiP,
    updatePiP,
  };
}

/**
 * Auto-enter PiP Hook
 *
 * Automatically enters PiP mode when app goes to background
 */
export function useAutoEnterPiP(shouldAutoEnter: boolean, params: PiPParams): void {
  const { isSupported, enterPiP } = usePictureInPicture();

  useEffect(() => {
    if (!shouldAutoEnter || !isSupported) return;

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        await enterPiP(params);
      }
    });

    return () => subscription.remove();
  }, [shouldAutoEnter, isSupported, params, enterPiP]);
}

/**
 * PiP Actions Hook
 *
 * Handle custom PiP action buttons
 */
export function usePiPActions(actions: PiPAction[]) {
  const { updatePiP } = usePictureInPicture();

  const updateActions = useCallback(
    async (newActions: PiPAction[]) => {
      await updatePiP({ actions: newActions });
    },
    [updatePiP]
  );

  useEffect(() => {
    const subscription = pipEmitter.addListener(
      'onPictureInPictureActionReceived',
      (event: { action: string }) => {
        const action = actions.find((a) => a.action === event.action);
        if (action) {
          console.log('Action triggered:', action);
        }
      }
    );

    return () => subscription.remove();
  }, [actions]);

  return { updateActions };
}
