// src/features/rental-properties/screens/rental-properties-list/types.ts
// Type definitions for rental properties list screen

import { RentalProperty, RentalType, PropertyStatus } from '../../types';

// Filter state for property list
export interface RentalPropertyFilters {
  rentalType: RentalType | 'all';
  status: PropertyStatus | 'all';
  sortBy: 'name' | 'created_at' | 'base_rate';
  sortOrder: 'asc' | 'desc';
}

// Extended property type with room counts (from join query)
export interface RentalPropertyWithRooms extends RentalProperty {
  rooms_count: number;
  occupied_rooms: number;
}

// Filter option types
export interface QuickFilterOption {
  key: RentalType | 'all';
  label: string;
}

export interface StatusFilterOption {
  label: string;
  value: PropertyStatus | 'all';
}

export interface SortOption {
  label: string;
  value: 'name' | 'created_at' | 'base_rate';
}
