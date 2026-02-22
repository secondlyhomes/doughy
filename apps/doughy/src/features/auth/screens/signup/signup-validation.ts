// src/features/auth/screens/signup/signup-validation.ts

import type { PasswordRequirements } from './signup-types';

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

export function isPasswordValid(requirements: PasswordRequirements): boolean {
  return Object.values(requirements).every(Boolean);
}
