/**
 * usePredictiveBack Hook
 *
 * Main hook for handling predictive back gestures on Android 13+
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import type { BackInvokedCallback, BackGestureEvent, UsePredictiveBackResult } from '../types';

const { PredictiveBackModule } = NativeModules;
const backEmitter = PredictiveBackModule
  ? new NativeEventEmitter(PredictiveBackModule)
  : null;

/**
 * Hook for handling Android 13+ predictive back gestures
 *
 * Falls back to standard BackHandler for Android <13
 *
 * @param callbacks - Event callbacks for back gesture lifecycle
 * @returns Animation value and gesture state
 */
export function usePredictiveBack(
  callbacks: BackInvokedCallback
): UsePredictiveBackResult {
  const animationValue = useRef(new Animated.Value(0)).current;
  const isGestureActive = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      // Fallback to standard BackHandler for Android <13
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (callbacks.onBackInvoked) {
            callbacks.onBackInvoked();
            return true;
          }
          return false;
        }
      );

      return () => backHandler.remove();
    }

    if (!backEmitter) {
      return;
    }

    // Android 13+ predictive back gesture listeners
    const startListener = backEmitter.addListener(
      'onBackStarted',
      (event: BackGestureEvent) => {
        isGestureActive.current = true;
        callbacks.onBackStarted?.(event);
      }
    );

    const progressListener = backEmitter.addListener(
      'onBackProgressed',
      (event: BackGestureEvent) => {
        animationValue.setValue(event.progress);
        callbacks.onBackProgressed?.(event);
      }
    );

    const cancelListener = backEmitter.addListener('onBackCancelled', () => {
      isGestureActive.current = false;
      Animated.spring(animationValue, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
      callbacks.onBackCancelled?.();
    });

    const invokeListener = backEmitter.addListener(
      'onBackInvoked',
      async () => {
        isGestureActive.current = false;
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(async () => {
          await callbacks.onBackInvoked?.();
        });
      }
    );

    // Register native callback
    PredictiveBackModule?.registerBackCallback?.();

    return () => {
      startListener.remove();
      progressListener.remove();
      cancelListener.remove();
      invokeListener.remove();
      PredictiveBackModule?.unregisterBackCallback?.();
    };
  }, [callbacks, animationValue]);

  return {
    animationValue,
    isGestureActive: isGestureActive.current,
  };
}
