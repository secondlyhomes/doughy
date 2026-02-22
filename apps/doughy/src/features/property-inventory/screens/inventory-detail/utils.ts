// src/features/property-inventory/screens/inventory-detail/utils.ts
// Utility functions for inventory detail screen

export { formatCurrency, formatDate } from '@/lib/formatters';

export type WarrantyStatus = 'expired' | 'expiring' | 'valid' | null;

export function getWarrantyStatus(warrantyExpires: string | null | undefined): WarrantyStatus {
  if (!warrantyExpires) return null;

  const expiryDate = new Date(warrantyExpires);
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (expiryDate < now) return 'expired';
  if (expiryDate < thirtyDaysFromNow) return 'expiring';
  return 'valid';
}
