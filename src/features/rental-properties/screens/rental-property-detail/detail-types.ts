// src/features/rental-properties/screens/rental-property-detail/detail-types.ts
// Types and constants for the property detail screen tabs

export type TabKey = 'overview' | 'financials' | 'rooms' | 'inventory' | 'listings';

export const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  financials: 'Financials',
  rooms: 'Rooms',
  inventory: 'Inventory',
  listings: 'Listings',
};
