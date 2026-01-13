// src/services/import/validation.ts
// Validation utilities for import services

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function validatePhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }
  const phoneRegex = /^[\d\s\-+().]{7,20}$/;
  return phoneRegex.test(phone);
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}
