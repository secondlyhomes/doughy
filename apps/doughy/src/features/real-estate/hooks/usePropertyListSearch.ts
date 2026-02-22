// src/features/real-estate/hooks/usePropertyListSearch.ts
// Search and filter logic for property list

import { useMemo } from 'react';
import { Property } from '../types';
import { PropertyFilters, SortOption } from './usePropertyFilters';

export function usePropertyListSearch(
  properties: Property[],
  searchQuery: string,
  filters: PropertyFilters,
  sortBy: SortOption
): Property[] {
  return useMemo(() => {
    let result = [...properties];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(property =>
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query) ||
        property.zip?.includes(query)
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(property =>
        property.status && filters.status.includes(property.status as PropertyFilters['status'][number])
      );
    }

    // Apply property type filter
    if (filters.propertyType.length > 0) {
      result = result.filter(property =>
        property.propertyType && filters.propertyType.includes(property.propertyType as PropertyFilters['propertyType'][number])
      );
    }

    // Apply price range filter
    if (filters.priceMin !== null) {
      result = result.filter(property =>
        property.purchase_price && property.purchase_price >= filters.priceMin!
      );
    }
    if (filters.priceMax !== null) {
      result = result.filter(property =>
        property.purchase_price && property.purchase_price <= filters.priceMax!
      );
    }

    // Apply ARV range filter
    if (filters.arvMin !== null) {
      result = result.filter(property => property.arv && property.arv >= filters.arvMin!);
    }
    if (filters.arvMax !== null) {
      result = result.filter(property => property.arv && property.arv <= filters.arvMax!);
    }

    // Apply bedrooms filter
    if (filters.bedroomsMin !== null) {
      result = result.filter(property =>
        property.bedrooms && property.bedrooms >= filters.bedroomsMin!
      );
    }
    if (filters.bedroomsMax !== null) {
      result = result.filter(property =>
        property.bedrooms && property.bedrooms <= filters.bedroomsMax!
      );
    }

    // Apply bathrooms filter
    if (filters.bathroomsMin !== null) {
      result = result.filter(property =>
        property.bathrooms && property.bathrooms >= filters.bathroomsMin!
      );
    }
    if (filters.bathroomsMax !== null) {
      result = result.filter(property =>
        property.bathrooms && property.bathrooms <= filters.bathroomsMax!
      );
    }

    // Apply location filters
    if (filters.city.trim()) {
      const cityQuery = filters.city.toLowerCase();
      result = result.filter(property => property.city?.toLowerCase().includes(cityQuery));
    }
    if (filters.state.trim()) {
      const stateQuery = filters.state.toLowerCase();
      result = result.filter(property => property.state?.toLowerCase() === stateQuery);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'created_asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'price_desc':
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        case 'price_asc':
          return (a.purchase_price || 0) - (b.purchase_price || 0);
        case 'arv_desc':
          return (b.arv || 0) - (a.arv || 0);
        case 'arv_asc':
          return (a.arv || 0) - (b.arv || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [properties, searchQuery, filters, sortBy]);
}
