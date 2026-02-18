// src/features/admin/types/integrations.ts
// TypeScript type definitions for the integration system

/**
 * Integration health status types
 */
export type IntegrationStatus =
  | 'operational' // Key works, API is reachable
  | 'configured' // Key exists but not tested yet
  | 'error' // Key exists but API returned error
  | 'not-configured' // No key in database
  | 'checking' // Health check in progress
  | 'active' // Enabled in database (legacy status value)
  | 'inactive'; // Disabled in database (legacy status value)

/**
 * Service categorization groups
 */
export type ServiceGroup = 'AI' | 'Maps' | 'Communication' | 'Payments' | 'Hosting' | 'Property Management' | 'Other';

/**
 * Field types for integration configuration
 */
export type IntegrationFieldType = 'text' | 'password' | 'select';

/**
 * API key record from database
 */
export interface ApiKeyRecord {
  id: string;
  service: string;
  key_ciphertext: string;
  group_name: ServiceGroup;
  status: IntegrationStatus | null;
  last_used: string | null;
  last_checked: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  is_encrypted: boolean | null;
  description: string | null;
}

/**
 * Integration health check result
 */
export interface IntegrationHealth {
  name: string;
  service: string;
  status: IntegrationStatus;
  latency?: string;
  message?: string;
  lastChecked?: Date;
  group?: ServiceGroup;
  authType?: 'apiKey' | 'oauth';
}

/**
 * Integration field configuration
 */
export interface IntegrationField {
  key: string; // Database service name
  label: string; // Display label
  type: IntegrationFieldType;
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  description?: string;
}

/**
 * Integration definition
 */
export interface Integration {
  id: string;
  name: string;
  service: string; // Primary service identifier
  description: string;
  icon: string;
  group: ServiceGroup;
  fields: IntegrationField[];
  requiresOAuth?: boolean;
  docsUrl?: string;
}

/**
 * Integration configuration result
 */
export interface IntegrationConfigResult {
  success: boolean;
  integration?: Integration;
  error?: string;
}

/**
 * API key save result
 */
export interface ApiKeySaveResult {
  success: boolean;
  error?: string;
}

/**
 * API key validation result
 */
export interface ApiKeyValidation {
  isValid: boolean;
  warning?: string;
}

/**
 * Health check request payload
 */
export interface HealthCheckRequest {
  service: string;
}

/**
 * Health check response payload
 */
export interface HealthCheckResponse {
  status: IntegrationStatus;
  latency?: number;
  message?: string;
  timestamp?: string;
}
