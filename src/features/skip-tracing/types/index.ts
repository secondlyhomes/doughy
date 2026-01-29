// src/features/skip-tracing/types/index.ts
// Type definitions for skip tracing / Tracerfy integration

/** Skip trace request status */
export type SkipTraceStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'no_results';

/** Data point categories from Tracerfy basic version */
export type DataPointCategory =
  | 'contact'
  | 'address'
  | 'property'
  | 'demographic'
  | 'social';

/** Individual data point */
export interface SkipTraceDataPoint {
  category: DataPointCategory;
  label: string;
  value: string;
  confidence?: number; // 0-100
  verified?: boolean;
  source?: string;
}

/** Phone number result */
export interface PhoneResult {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  verified: boolean;
  dnc: boolean; // Do Not Call registry
}

/** Email result */
export interface EmailResult {
  address: string;
  verified: boolean;
  type: 'personal' | 'work' | 'unknown';
}

/** Address result */
export interface AddressResult {
  street: string;
  city: string;
  state: string;
  zip: string;
  type: 'current' | 'previous' | 'mailing';
  yearsAtAddress?: number;
  isOwner?: boolean;
}

/** Property ownership result */
export interface PropertyOwnership {
  address: string;
  city: string;
  state: string;
  zip: string;
  purchaseDate?: string;
  purchasePrice?: number;
  estimatedValue?: number;
  ownershipType: 'primary' | 'investment' | 'unknown';
}

/** Skip trace result for a person */
export interface SkipTraceResult {
  id: string;
  user_id: string;
  contact_id?: string;
  lead_id?: string;
  property_id?: string;

  // Input data
  input_first_name?: string;
  input_last_name?: string;
  input_address?: string;
  input_city?: string;
  input_state?: string;
  input_zip?: string;

  // Status
  status: SkipTraceStatus;
  tracerfy_request_id?: string;
  processed_at?: string;
  error_message?: string;

  // Results
  phones: PhoneResult[];
  emails: EmailResult[];
  addresses: AddressResult[];
  properties_owned: PropertyOwnership[];
  data_points: SkipTraceDataPoint[];

  // Matching
  matched_property_id?: string;
  match_confidence?: number;

  // Metadata
  credits_used: number;
  created_at: string;
  updated_at: string;
}

/** Skip trace result with relations */
export interface SkipTraceResultWithRelations extends SkipTraceResult {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  lead?: {
    id: string;
    name: string; // crm_leads uses 'name' (full name), not separate first/last
  };
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
  matched_property?: {
    id: string;
    address: string;
    city: string;
    state: string;
  };
}

/**
 * Input for skip trace request.
 *
 * VALIDATION REQUIREMENT: At least one of the following must be provided:
 * - A name (first_name OR last_name)
 * - An address (address with city and state)
 * - A linked record (contact_id, lead_id, or property_id)
 *
 * Use `isValidSkipTraceInput()` to validate before submission.
 */
export interface SkipTraceInput {
  // Person identification
  first_name?: string;
  last_name?: string;

  // Address identification
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Link to existing records (optional, for tracking)
  contact_id?: string;
  lead_id?: string;
  property_id?: string;
}

/**
 * Validates that SkipTraceInput has sufficient data for a skip trace.
 * Returns true if at least one identifier is present.
 */
export function isValidSkipTraceInput(input: SkipTraceInput): boolean {
  const hasName = Boolean(input.first_name?.trim() || input.last_name?.trim());
  const hasAddress = Boolean(input.address?.trim() && input.city?.trim() && input.state?.trim());
  const hasLinkedRecord = Boolean(input.contact_id || input.lead_id || input.property_id);

  return hasName || hasAddress || hasLinkedRecord;
}

/**
 * Gets a description of what's missing from SkipTraceInput.
 */
export function getSkipTraceInputValidationError(input: SkipTraceInput): string | null {
  if (isValidSkipTraceInput(input)) {
    return null;
  }
  return 'Please provide a name, address (with city and state), or link to an existing contact/lead.';
}

/** Skip trace summary */
export interface SkipTraceSummary {
  totalTraces: number;
  completedTraces: number;
  pendingTraces: number;
  failedTraces: number;
  totalPhones: number;
  totalEmails: number;
  propertiesMatched: number;
}

/** Tracerfy API configuration */
export interface TracerfyApiConfig {
  apiKey: string;
  autoSkipTrace: boolean;
  autoMatchToProperty: boolean;
}

/** Basic data points available in Tracerfy basic version */
export const TRACERFY_BASIC_DATA_POINTS = [
  // Contact
  { category: 'contact' as const, label: 'Phone Numbers', key: 'phones' },
  { category: 'contact' as const, label: 'Email Addresses', key: 'emails' },

  // Address
  { category: 'address' as const, label: 'Current Address', key: 'current_address' },
  { category: 'address' as const, label: 'Previous Addresses', key: 'previous_addresses' },
  { category: 'address' as const, label: 'Mailing Address', key: 'mailing_address' },

  // Property
  { category: 'property' as const, label: 'Properties Owned', key: 'properties_owned' },
  { category: 'property' as const, label: 'Property Values', key: 'property_values' },

  // Demographic
  { category: 'demographic' as const, label: 'Age Range', key: 'age_range' },
  { category: 'demographic' as const, label: 'Household Members', key: 'household' },

  // Social (limited in basic)
  { category: 'social' as const, label: 'LinkedIn Profile', key: 'linkedin' },
];

/** Status configuration for display */
export interface SkipTraceStatusConfig {
  label: string;
  color: 'success' | 'warning' | 'destructive' | 'muted' | 'info';
}

export const SKIP_TRACE_STATUS_CONFIG: Record<SkipTraceStatus, SkipTraceStatusConfig> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  failed: { label: 'Failed', color: 'destructive' },
  no_results: { label: 'No Results', color: 'muted' },
};
