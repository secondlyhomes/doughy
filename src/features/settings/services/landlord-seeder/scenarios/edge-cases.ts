// src/features/settings/services/landlord-seeder/scenarios/edge-cases.ts
// Edge cases and security test seed scenario

import { supabase } from '@/lib/supabase';

import type { SeedScenario } from '../types';
import { getPropertyImage } from '../constants';
import { ensureUserHasWorkspace } from '../helpers';

export const seedEdgeCases: SeedScenario = {
  id: 'edge-cases',
  name: 'Edge Cases & Security Tests',
  description: 'Special characters, SQL injection attempts, boundary values',
  seed: async (userId: string) => {
    await ensureUserHasWorkspace(userId);

    // Create property for testing
    const { data: property, error: propertyError } = await supabase.from('landlord_properties').insert({
      user_id: userId,
      name: 'Test Property - Edge Cases <script>alert("xss")</script>',
      address: '999 Test Street; DROP TABLE users;--',
      city: "Los Angeles",
      state: 'CA',
      zip: '90001',
      property_type: 'single_family',
      rental_type: 'str',
      bedrooms: 1,
      bathrooms: 1,
      base_rate: 100,
      rate_type: 'nightly',
      status: 'active',
      internal_notes: "Testing <img src=x onerror=alert('xss')> and ' OR '1'='1",
      primary_image_url: getPropertyImage(7),
    }).select().single();

    if (propertyError) throw new Error(`Failed to create test property: ${propertyError.message}`);
    console.log('Created edge case property');

    // Edge case inventory items
    const { error: inventoryError } = await supabase.from('landlord_inventory_items').insert([
      {
        user_id: userId,
        property_id: property.id,
        name: "Item with 'quotes' and \"double quotes\"",
        category: 'appliance',
        location: '<Kitchen>',
        notes: "Testing: '); DELETE FROM property_inventory; --",
        condition: 'good',
      },
      {
        user_id: userId,
        property_id: property.id,
        name: 'Item with unicode: ',
        category: 'furniture',
        location: 'Living Room',
        notes: 'Arabic: , Chinese: , Emoji: ',
        condition: 'excellent',
      },
      {
        user_id: userId,
        property_id: property.id,
        name: 'Boundary test - MAX values',
        category: 'other',
        purchase_price: 999999.99,
        replacement_cost: 999999.99,
        condition: 'needs_replacement',
        notes: 'A'.repeat(500), // Long string
      },
      {
        user_id: userId,
        property_id: property.id,
        name: 'Boundary test - MIN/zero values',
        category: 'other',
        purchase_price: 0,
        replacement_cost: 0.01,
        condition: 'poor',
      },
    ]);

    if (inventoryError) throw new Error(`Failed to create edge case inventory: ${inventoryError.message}`);
    console.log('Created edge case inventory');

    // Edge case vendor
    const { error: vendorError } = await supabase.from('landlord_vendors').insert({
      user_id: userId,
      category: 'other',
      name: "Test O'Vendor <script>",
      company_name: "Company & Sons' LLC \"Best\"",
      phone: '555-000-0000',
      email: 'test+special@example.com',
      notes: "Notes with\nnewlines\tand\ttabs",
      hourly_rate: 0.01,
      rating: 1,
    });

    if (vendorError) throw new Error(`Failed to create edge case vendor: ${vendorError.message}`);
    console.log('Created edge case vendor');

    // Edge case contact
    const { data: contact, error: contactError } = await supabase.from('crm_contacts').insert({
      user_id: userId,
      first_name: 'Test',
      last_name: "User'); DROP TABLE crm_contacts;--",
      email: 'test@example.com',
      phone: '555-999-9999',
      contact_types: ['guest'],
      source: 'direct',
      status: 'active',
    }).select().single();

    if (contactError) throw new Error(`Failed to create edge case contact: ${contactError.message}`);
    console.log('Created edge case contact');

    // Edge case booking
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const { data: booking, error: bookingError } = await supabase.from('landlord_bookings').insert({
      user_id: userId,
      property_id: property.id,
      contact_id: contact.id,
      booking_type: 'reservation',
      status: 'completed',
      start_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: yesterday.toISOString().split('T')[0],
      rate: 100,
      rate_type: 'nightly',
      total_amount: 700,
      source: 'direct',
      notes: "Guest note: <script>alert('xss')</script>",
    }).select().single();

    if (bookingError) throw new Error(`Failed to create edge case booking: ${bookingError.message}`);
    console.log('Created edge case booking');

    // Edge case charges
    const { error: chargesError } = await supabase.from('landlord_booking_charges').insert([
      {
        user_id: userId,
        booking_id: booking.id,
        charge_type: 'damage',
        description: "Description with SQL: '; DROP TABLE booking_charges;--",
        amount: 0.01, // Minimum amount
        status: 'pending',
      },
      {
        user_id: userId,
        booking_id: booking.id,
        charge_type: 'other',
        description: 'X'.repeat(255), // Max length string
        amount: 9999.99, // High amount
        status: 'pending',
        notes: "Notes: <img src=x onerror=alert('hack')>",
      },
    ]);

    if (chargesError) throw new Error(`Failed to create edge case charges: ${chargesError.message}`);
    console.log('Created edge case charges');

    // Edge case maintenance
    const { error: maintenanceError } = await supabase.from('landlord_maintenance_records').insert({
      user_id: userId,
      property_id: property.id,
      work_order_number: 'WO-TEST-001',
      title: "Fix ' OR '1'='1' --",
      description: '<script>alert("XSS")</script> and normal text',
      category: 'other',
      status: 'reported',
      priority: 'low',
      charge_to: 'owner',
    });

    if (maintenanceError) throw new Error(`Failed to create edge case maintenance: ${maintenanceError.message}`);
    console.log('Created edge case maintenance');

    console.log('Edge cases scenario completed - all inputs safely stored!');
  },
};
