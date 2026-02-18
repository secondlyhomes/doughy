// src/hooks/useKeyboard.ts
// Keyboard visibility hook for React Native
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
}

/**
 * Hook to track keyboard visibility and height
 * @returns keyboard state object
 */
export function useKeyboard(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      setKeyboardState({
        isVisible: true,
        keyboardHeight: event.endCoordinates.height,
      });
    };

    const handleHide = () => {
      setKeyboardState({
        isVisible: false,
        keyboardHeight: 0,
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardState;
}

/**
 * Hook to dismiss keyboard on tap outside
 */
export function useDismissKeyboard() {
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return dismissKeyboard;
}
