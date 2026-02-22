// src/features/leads/hooks/leadQueries.ts
// Query functions for fetching leads from Supabase

import { Lead, LeadWithProperties } from '../types';
import { supabase } from '@/lib/supabase';
import { mapRowToLead, PAGE_SIZE } from './leadMappers';

// Paginated fetch result type
export interface PaginatedLeadsResult {
  leads: Lead[];
  nextCursor: number | null;
  hasMore: boolean;
}

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .schema('crm').from('leads')
    .select('*')
    .eq('is_deleted', false)
    .eq('module', 'investor')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  return (data || []).map(mapRowToLead);
}

// Paginated fetch function for useInfiniteQuery
export async function fetchLeadsPaginated(pageParam: number = 0): Promise<PaginatedLeadsResult> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .schema('crm').from('leads')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('module', 'investor')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching paginated leads:', error);
    throw error;
  }

  const leads = (data || []).map(mapRowToLead);
  const totalCount = count || 0;
  const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount;

  return {
    leads,
    nextCursor: hasMore ? pageParam + 1 : null,
    hasMore,
  };
}

export async function fetchLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .schema('crm').from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching lead:', error);
    throw error;
  }

  if (!data) return null;

  return mapRowToLead(data);
}

// Fetch leads with their associated properties (hierarchical view)
export async function fetchLeadsWithProperties(): Promise<LeadWithProperties[]> {
  // First fetch all leads
  const { data: leadsData, error: leadsError } = await supabase
    .schema('crm').from('leads')
    .select('*')
    .eq('is_deleted', false)
    .eq('module', 'investor')
    .order('created_at', { ascending: false });

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
    throw leadsError;
  }

  // Then fetch all properties with lead_id, including their images
  // Use * with join syntax (same pattern as useProperties.ts) to ensure images are properly fetched
  const { data: propertiesData, error: propertiesError } = await supabase
    .schema('investor').from('properties')
    .select(`
      *,
      images:property_images(id, url, is_primary, label)
    `)
    .not('lead_id', 'is', null);

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    throw propertiesError;
  }

  // Group properties by lead_id
  const propertiesByLead = new Map<string, LeadWithProperties['properties']>();
  (propertiesData || []).forEach((prop) => {
    if (prop.lead_id) {
      const existing = propertiesByLead.get(prop.lead_id) || [];
      existing.push({
        id: prop.id,
        address_line_1: prop.address_line_1,
        address_line_2: prop.address_line_2 || undefined,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        bedrooms: prop.bedrooms || undefined,
        bathrooms: prop.bathrooms ? Number(prop.bathrooms) : undefined,
        square_feet: prop.square_feet || undefined,
        arv: prop.arv ? Number(prop.arv) : undefined,
        purchase_price: prop.purchase_price ? Number(prop.purchase_price) : undefined,
        status: prop.status || undefined,
        property_type: prop.property_type || undefined,
        images: (prop.images || []).map((img: { id: string; url: string; is_primary: boolean | null; label: string | null }) => ({
          id: img.id,
          url: img.url,
          is_primary: img.is_primary ?? undefined,
          label: img.label ?? undefined,
        })),
      });
      propertiesByLead.set(prop.lead_id, existing);
    }
  });

  // Map leads with their properties
  const leadsWithProperties: LeadWithProperties[] = (leadsData || []).map((row) => {
    const properties = propertiesByLead.get(row.id) || [];
    return {
      ...mapRowToLead(row),
      properties,
      propertyCount: properties.length,
    };
  });

  return leadsWithProperties;
}

// Fetch orphan properties (no lead assigned) - for "Unknown Seller" section
export async function fetchOrphanProperties(): Promise<LeadWithProperties['properties']> {
  const { data, error } = await supabase
    .schema('investor').from('properties')
    .select(`
      id, address_line_1, address_line_2, city, state, zip,
      bedrooms, bathrooms, square_feet, arv, purchase_price, status, property_type,
      images:property_images(id, url, is_primary, label)
    `)
    .is('lead_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orphan properties:', error);
    throw error;
  }

  return (data || []).map((prop) => ({
    id: prop.id,
    address_line_1: prop.address_line_1,
    address_line_2: prop.address_line_2 || undefined,
    city: prop.city,
    state: prop.state,
    zip: prop.zip,
    bedrooms: prop.bedrooms || undefined,
    bathrooms: prop.bathrooms ? Number(prop.bathrooms) : undefined,
    square_feet: prop.square_feet || undefined,
    arv: prop.arv ? Number(prop.arv) : undefined,
    purchase_price: prop.purchase_price ? Number(prop.purchase_price) : undefined,
    status: prop.status || undefined,
    property_type: prop.property_type || undefined,
    images: (prop.images || []).map((img: { id: string; url: string; is_primary: boolean | null; label: string | null }) => ({
      id: img.id,
      url: img.url,
      is_primary: img.is_primary ?? undefined,
      label: img.label ?? undefined,
    })),
  }));
}
