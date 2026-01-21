#!/usr/bin/env npx tsx
/**
 * Script to add placeholder Unsplash images to properties
 * Run with: npx tsx scripts/add-placeholder-images.ts
 */

import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

console.log(`Using Supabase URL: ${SUPABASE_URL}`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',  // Modern white house
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',  // Luxury home exterior
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',  // Modern house with pool
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',  // Suburban home
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800',  // Cozy house
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',  // Modern architecture
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',  // Pink house
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',  // Luxury villa
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',  // Contemporary home
  'https://images.unsplash.com/photo-1600573472591-ee6981cf35f5?w=800',  // Ranch style
];

async function main() {
  console.log('Fetching properties without images...');

  // Get all properties
  const { data: properties, error: propError } = await supabase
    .from('re_properties')
    .select('id, address_line_1, workspace_id');

  if (propError) {
    console.error('Error fetching properties:', propError);
    process.exit(1);
  }

  if (!properties || properties.length === 0) {
    console.log('No properties found');
    return;
  }

  console.log(`Found ${properties.length} properties`);

  // Get existing images to avoid duplicates
  const { data: existingImages, error: imgError } = await supabase
    .from('re_property_images')
    .select('property_id');

  if (imgError) {
    console.error('Error fetching existing images:', imgError);
    process.exit(1);
  }

  const existingPropertyIds = new Set(existingImages?.map(img => img.property_id) || []);
  const propertiesWithoutImages = properties.filter(p => !existingPropertyIds.has(p.id));

  console.log(`${propertiesWithoutImages.length} properties need images`);

  if (propertiesWithoutImages.length === 0) {
    console.log('All properties already have images!');
    return;
  }

  // Insert images for each property
  const imagesToInsert = propertiesWithoutImages.map((prop, index) => ({
    property_id: prop.id,
    url: UNSPLASH_IMAGES[index % UNSPLASH_IMAGES.length],
    is_primary: true,
    label: 'Primary Photo',
    workspace_id: prop.workspace_id,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('re_property_images')
    .insert(imagesToInsert)
    .select();

  if (insertError) {
    console.error('Error inserting images:', insertError);
    process.exit(1);
  }

  console.log(`Successfully added ${inserted?.length || 0} placeholder images!`);
}

main();
