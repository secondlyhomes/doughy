// src/features/leads/components/expandable-lead-card-types.ts
// Types and utilities for ExpandableLeadCard

import { Platform, UIManager } from 'react-native';
import type { Property } from '@/features/real-estate/types/property';

import { LeadWithProperties, LeadProperty } from '../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ExpandableLeadCardProps {
  lead: LeadWithProperties;
  onLeadPress?: () => void;
  onPropertyPress?: (property: LeadProperty) => void;
  onStartDeal?: (leadId: string | undefined, propertyId?: string) => void;
  initiallyExpanded?: boolean;
  /** View mode for properties: 'card' shows PropertyCard, 'list' shows compact rows */
  propertyViewMode?: 'list' | 'card';
}

/** Convert LeadProperty to Property for use with PropertyCard */
export function leadPropertyToProperty(leadProp: LeadProperty): Property {
  return {
    id: leadProp.id,
    address: leadProp.address_line_1,
    address_line_1: leadProp.address_line_1,
    address_line_2: leadProp.address_line_2,
    city: leadProp.city,
    state: leadProp.state,
    zip: leadProp.zip,
    bedrooms: leadProp.bedrooms ?? 0,
    bathrooms: leadProp.bathrooms ?? 0,
    square_feet: leadProp.square_feet ?? 0,
    arv: leadProp.arv,
    purchase_price: leadProp.purchase_price,
    status: leadProp.status,
    propertyType: leadProp.property_type || 'other',
    property_type: leadProp.property_type,
    images: leadProp.images?.map(img => ({
      id: img.id,
      property_id: leadProp.id,
      url: img.url,
      is_primary: img.is_primary,
      label: img.label,
    })),
  };
}
