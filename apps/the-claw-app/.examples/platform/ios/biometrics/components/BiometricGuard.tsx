/**
 * BiometricGuard.tsx
 *
 * Wrapper component that requires biometric authentication
 */

import React, { useState, useEffect } from 'react';
import { BiometricGuardProps } from '../types';
import { useBiometricAuth } from '../hooks';

/**
 * Biometric guard wrapper
 * Requires biometric authentication before rendering children
 */
export function BiometricGuard({
  children,
  fallback,
  promptMessage,
}: BiometricGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAvailable, authenticate } = useBiometricAuth();

  useEffect(() => {
    if (isAvailable) {
      authenticateUser();
    } else {
      // No biometric available, allow access
      setIsAuthenticated(true);
    }
  }, [isAvailable]);

  const authenticateUser = async () => {
    const result = await authenticate({ promptMessage });
    setIsAuthenticated(result.success);
  };

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
