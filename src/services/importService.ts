// src/services/importService.ts
// Zone D: Import service for bulk data import operations
// Note: This service uses dynamic table access since some tables may not
// exactly match the Supabase schema types. Operations will work at runtime.

import { supabase } from '@/lib/supabase';
import type { Lead, Property, LeadFormData, PropertyFormData } from '@/types';

// Type-safe access to tables (bypasses strict schema typing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leadsTable = () => supabase.from('leads' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const propertiesTable = () => supabase.from('properties' as any);

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  validateOnly?: boolean;
}

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // Accept various phone formats
  const phoneRegex = /^[\d\s\-+().]{7,20}$/;
  return phoneRegex.test(phone);
}

function normalizeLeadData(data: Record<string, unknown>): LeadFormData | null {
  // Map common CSV column names to our schema
  const firstName = data.first_name || data.firstName || data.name?.toString().split(' ')[0] || '';
  const lastName = data.last_name || data.lastName || data.name?.toString().split(' ').slice(1).join(' ') || '';
  const email = data.email || '';
  const phone = data.phone || data.phone_number || data.phoneNumber || '';

  if (!firstName) {
    return null; // First name is required
  }

  return {
    first_name: String(firstName),
    last_name: lastName ? String(lastName) : undefined,
    email: email ? String(email) : undefined,
    phone: phone ? String(phone) : undefined,
    source: normalizeSource(data.source),
    status: normalizeLeadStatus(data.status),
    priority: normalizePriority(data.priority),
    notes: data.notes ? String(data.notes) : undefined,
    budget_min: data.budget_min ? Number(data.budget_min) : undefined,
    budget_max: data.budget_max ? Number(data.budget_max) : undefined,
    preferred_location: data.preferred_location ? String(data.preferred_location) : undefined,
  };
}

function normalizeSource(source: unknown): Lead['source'] {
  const s = String(source).toLowerCase();
  const sourceMap: Record<string, Lead['source']> = {
    website: 'website',
    web: 'website',
    referral: 'referral',
    ref: 'referral',
    social: 'social',
    facebook: 'social',
    instagram: 'social',
    linkedin: 'social',
    cold_call: 'cold_call',
    coldcall: 'cold_call',
    'cold call': 'cold_call',
    email: 'email',
    other: 'other',
  };
  return sourceMap[s] || 'other';
}

function normalizeLeadStatus(status: unknown): Lead['status'] {
  const s = String(status).toLowerCase();
  const statusMap: Record<string, Lead['status']> = {
    new: 'new',
    contacted: 'contacted',
    qualified: 'qualified',
    proposal: 'proposal',
    negotiation: 'negotiation',
    closed_won: 'closed_won',
    'closed won': 'closed_won',
    won: 'closed_won',
    closed_lost: 'closed_lost',
    'closed lost': 'closed_lost',
    lost: 'closed_lost',
  };
  return statusMap[s] || 'new';
}

function normalizePriority(priority: unknown): Lead['priority'] {
  const p = String(priority).toLowerCase();
  const priorityMap: Record<string, Lead['priority']> = {
    low: 'low',
    medium: 'medium',
    med: 'medium',
    high: 'high',
  };
  return priorityMap[p] || 'medium';
}

function normalizePropertyData(data: Record<string, unknown>): PropertyFormData | null {
  const address = data.address || data.street_address || '';

  if (!address) {
    return null; // Address is required
  }

  return {
    address: String(address),
    city: data.city ? String(data.city) : undefined,
    state: data.state ? String(data.state) : undefined,
    zip_code: data.zip_code || data.zipCode || data.zip ? String(data.zip_code || data.zipCode || data.zip) : undefined,
    country: data.country ? String(data.country) : undefined,
    property_type: normalizePropertyType(data.property_type || data.propertyType || data.type),
    status: normalizePropertyStatus(data.status),
    price: data.price ? Number(String(data.price).replace(/[^0-9.-]/g, '')) : undefined,
    bedrooms: data.bedrooms || data.beds ? Number(data.bedrooms || data.beds) : undefined,
    bathrooms: data.bathrooms || data.baths ? Number(data.bathrooms || data.baths) : undefined,
    sqft: data.sqft || data.square_feet || data.squareFeet ? Number(data.sqft || data.square_feet || data.squareFeet) : undefined,
    lot_size: data.lot_size || data.lotSize ? Number(data.lot_size || data.lotSize) : undefined,
    year_built: data.year_built || data.yearBuilt ? Number(data.year_built || data.yearBuilt) : undefined,
    description: data.description ? String(data.description) : undefined,
  };
}

function normalizePropertyType(type: unknown): Property['property_type'] {
  const t = String(type).toLowerCase().replace(/[_-]/g, ' ');
  const typeMap: Record<string, Property['property_type']> = {
    'single family': 'single_family',
    'single-family': 'single_family',
    'single_family': 'single_family',
    sfh: 'single_family',
    house: 'single_family',
    'multi family': 'multi_family',
    'multi-family': 'multi_family',
    'multi_family': 'multi_family',
    multifamily: 'multi_family',
    duplex: 'multi_family',
    triplex: 'multi_family',
    fourplex: 'multi_family',
    condo: 'condo',
    condominium: 'condo',
    townhouse: 'townhouse',
    townhome: 'townhouse',
    land: 'land',
    lot: 'land',
    commercial: 'commercial',
    retail: 'commercial',
    office: 'commercial',
    other: 'other',
  };
  return typeMap[t] || 'other';
}

function normalizePropertyStatus(status: unknown): Property['status'] {
  const s = String(status).toLowerCase();
  const statusMap: Record<string, Property['status']> = {
    active: 'active',
    available: 'active',
    'for sale': 'active',
    pending: 'pending',
    'under contract': 'pending',
    sold: 'sold',
    closed: 'sold',
    off_market: 'off_market',
    'off market': 'off_market',
    inactive: 'off_market',
  };
  return statusMap[s] || 'active';
}

/**
 * Service for importing bulk data from CSV/JSON sources.
 */
export const importService = {
  /**
   * Import leads from an array of data objects (parsed from CSV/JSON).
   */
  async importLeads(
    data: Record<string, unknown>[],
    userId: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    if (!data || data.length === 0) {
      return result;
    }

    const leadsToInsert: Array<LeadFormData & { user_id: string }> = [];

    // Validate and normalize all data first
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const normalized = normalizeLeadData(row);

      if (!normalized) {
        result.failed++;
        result.errors.push({ row: i + 1, message: 'Missing required field: first_name' });
        continue;
      }

      // Validate email if provided
      if (normalized.email && !validateEmail(normalized.email)) {
        result.failed++;
        result.errors.push({ row: i + 1, message: `Invalid email: ${normalized.email}` });
        continue;
      }

      // Validate phone if provided
      if (normalized.phone && !validatePhone(normalized.phone)) {
        result.failed++;
        result.errors.push({ row: i + 1, message: `Invalid phone: ${normalized.phone}` });
        continue;
      }

      leadsToInsert.push({ ...normalized, user_id: userId });
    }

    // If validate only, return early
    if (options.validateOnly) {
      result.success = leadsToInsert.length;
      return result;
    }

    // Check for duplicates if option is set
    if (options.skipDuplicates && leadsToInsert.length > 0) {
      const emails = leadsToInsert
        .filter(l => l.email)
        .map(l => l.email);

      if (emails.length > 0) {
        const { data: existingLeads } = await leadsTable()
          .select('email')
          .eq('user_id', userId)
          .in('email', emails as string[]);

        const existingEmails = new Set(existingLeads?.map(l => l.email) || []);

        const filteredLeads = leadsToInsert.filter(l => {
          if (!l.email || !existingEmails.has(l.email)) return true;
          result.failed++;
          result.errors.push({
            row: data.findIndex(d => d.email === l.email) + 1,
            message: `Duplicate email: ${l.email}`
          });
          return false;
        });

        leadsToInsert.length = 0;
        leadsToInsert.push(...filteredLeads);
      }
    }

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
      const batch = leadsToInsert.slice(i, i + BATCH_SIZE);

      const { error, count } = await leadsTable()
        .insert(batch);

      if (error) {
        result.failed += batch.length;
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.success += count ?? batch.length;
      }
    }

    return result;
  },

  /**
   * Import properties from an array of data objects (parsed from CSV/JSON).
   */
  async importProperties(
    data: Record<string, unknown>[],
    userId: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    if (!data || data.length === 0) {
      return result;
    }

    const propertiesToInsert: Array<PropertyFormData & { user_id: string }> = [];

    // Validate and normalize all data first
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const normalized = normalizePropertyData(row);

      if (!normalized) {
        result.failed++;
        result.errors.push({ row: i + 1, message: 'Missing required field: address' });
        continue;
      }

      // Validate numeric fields
      if (normalized.price !== undefined && (isNaN(normalized.price) || normalized.price < 0)) {
        result.failed++;
        result.errors.push({ row: i + 1, message: 'Invalid price value' });
        continue;
      }

      if (normalized.bedrooms !== undefined && (isNaN(normalized.bedrooms) || normalized.bedrooms < 0)) {
        result.failed++;
        result.errors.push({ row: i + 1, message: 'Invalid bedrooms value' });
        continue;
      }

      if (normalized.bathrooms !== undefined && (isNaN(normalized.bathrooms) || normalized.bathrooms < 0)) {
        result.failed++;
        result.errors.push({ row: i + 1, message: 'Invalid bathrooms value' });
        continue;
      }

      propertiesToInsert.push({ ...normalized, user_id: userId });
    }

    // If validate only, return early
    if (options.validateOnly) {
      result.success = propertiesToInsert.length;
      return result;
    }

    // Check for duplicates if option is set
    if (options.skipDuplicates && propertiesToInsert.length > 0) {
      const addresses = propertiesToInsert.map(p => p.address);

      const { data: existingProperties } = await propertiesTable()
        .select('address')
        .eq('user_id', userId)
        .in('address', addresses);

      const existingAddresses = new Set(existingProperties?.map(p => p.address) || []);

      const filteredProperties = propertiesToInsert.filter(p => {
        if (!existingAddresses.has(p.address)) return true;
        result.failed++;
        result.errors.push({
          row: data.findIndex(d => d.address === p.address) + 1,
          message: `Duplicate address: ${p.address}`
        });
        return false;
      });

      propertiesToInsert.length = 0;
      propertiesToInsert.push(...filteredProperties);
    }

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < propertiesToInsert.length; i += BATCH_SIZE) {
      const batch = propertiesToInsert.slice(i, i + BATCH_SIZE);

      const { error, count } = await propertiesTable()
        .insert(batch);

      if (error) {
        result.failed += batch.length;
        result.errors.push({ row: i + 1, message: error.message });
      } else {
        result.success += count ?? batch.length;
      }
    }

    return result;
  },

  /**
   * Parse CSV string into array of objects.
   * Simple CSV parser for basic use cases.
   */
  parseCSV(csvString: string): Record<string, unknown>[] {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const data: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  },

  /**
   * Validate import data without actually importing.
   */
  async validateLeadsImport(
    data: Record<string, unknown>[],
    userId: string
  ): Promise<ImportResult> {
    return this.importLeads(data, userId, { validateOnly: true });
  },

  async validatePropertiesImport(
    data: Record<string, unknown>[],
    userId: string
  ): Promise<ImportResult> {
    return this.importProperties(data, userId, { validateOnly: true });
  },
};

export default importService;
