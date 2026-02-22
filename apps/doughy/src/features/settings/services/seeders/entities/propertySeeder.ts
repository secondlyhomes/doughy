// src/features/settings/services/seeders/entities/propertySeeder.ts
// Property seeder for landlord platform

import { supabase } from '@/lib/supabase';
import { getPropertyImage } from '../common/images';
import type { PropertySeedData } from '../types';

export interface CreatedProperty {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Create a single property
 */
export async function createProperty(
  userId: string,
  data: PropertySeedData
): Promise<CreatedProperty> {
  const { data: property, error } = await supabase
    .schema('landlord').from('properties')
    .insert({
      user_id: userId,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      property_type: data.property_type,
      rental_type: data.rental_type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      square_feet: data.square_feet,
      base_rate: data.base_rate,
      rate_type: data.rate_type,
      cleaning_fee: data.cleaning_fee,
      security_deposit: data.security_deposit,
      status: data.status || 'active',
      amenities: data.amenities || [],
      primary_image_url: getPropertyImage(data.imageIndex || 0),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw new Error(`Failed to create property: ${error.message}`);
  }

  if (!property) throw new Error('Property was not created');
  console.log('Created property:', property.id);

  return property as CreatedProperty;
}

/**
 * Create multiple properties
 */
export async function createProperties(
  userId: string,
  propertiesData: PropertySeedData[]
): Promise<CreatedProperty[]> {
  const { data: properties, error } = await supabase
    .schema('landlord').from('properties')
    .insert(
      propertiesData.map((p, i) => ({
        user_id: userId,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
        property_type: p.property_type,
        rental_type: p.rental_type,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        square_feet: p.square_feet,
        base_rate: p.base_rate,
        rate_type: p.rate_type,
        cleaning_fee: p.cleaning_fee,
        security_deposit: p.security_deposit,
        status: p.status || 'active',
        amenities: p.amenities || [],
        primary_image_url: getPropertyImage(p.imageIndex ?? i),
      }))
    )
    .select();

  if (error) {
    console.error('Error creating properties:', error);
    throw new Error(`Failed to create properties: ${error.message}`);
  }

  if (!properties || properties.length === 0) {
    throw new Error('Properties were not created');
  }

  console.log('Created properties:', properties.length);
  return properties as CreatedProperty[];
}

/**
 * Delete all properties for a user
 */
export async function deleteUserProperties(userId: string): Promise<void> {
  const { error } = await supabase
    .schema('landlord').from('properties')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete properties: ${error.message}`);
  }
}
