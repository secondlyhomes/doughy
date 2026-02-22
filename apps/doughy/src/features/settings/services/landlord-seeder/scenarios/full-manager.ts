// src/features/settings/services/landlord-seeder/scenarios/full-manager.ts
// Full property manager seed scenario with all features

import { supabase } from '@/lib/supabase';

import type { SeedScenario } from '../types';
import { getPropertyImage } from '../constants';
import { ensureUserHasWorkspace } from '../helpers';

export const seedFullPropertyManager: SeedScenario = {
  id: 'full-manager',
  name: 'Full Property Manager',
  description: '2 properties with inventory, vendors, maintenance, turnovers, charges, edge cases',
  seed: async (userId: string) => {
    await ensureUserHasWorkspace(userId);

    // Create Properties
    const { data: properties, error: propertiesError } = await supabase.schema('landlord').from('properties').insert([
      {
        user_id: userId,
        name: 'Oceanview Villa',
        address: '100 Beach Boulevard',
        city: 'San Diego',
        state: 'CA',
        zip: '92109',
        property_type: 'single_family',
        rental_type: 'str',
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 2800,
        base_rate: 450,
        rate_type: 'nightly',
        cleaning_fee: 250,
        security_deposit: 1000,
        status: 'active',
        amenities: ['wifi', 'pool', 'parking', 'ac', 'kitchen', 'hot_tub'],
        primary_image_url: getPropertyImage(5),
      },
      {
        user_id: userId,
        name: 'Downtown Condo',
        address: '500 Main St, Unit 8B',
        city: 'San Diego',
        state: 'CA',
        zip: '92101',
        property_type: 'condo',
        rental_type: 'mtr',
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1200,
        base_rate: 3500,
        rate_type: 'monthly',
        security_deposit: 3500,
        status: 'active',
        amenities: ['wifi', 'gym', 'parking', 'ac', 'doorman'],
        primary_image_url: getPropertyImage(6),
      },
    ]).select();

    if (propertiesError) {
      console.error('Properties insert error:', JSON.stringify(propertiesError, null, 2));
      throw new Error(`Failed to create properties: ${propertiesError.message}`);
    }
    if (!properties || properties.length < 2) throw new Error('Properties were not created');
    console.log('Created properties:', properties.length);

    // Create Vendors
    const { data: vendors, error: vendorsError } = await supabase.schema('landlord').from('vendors').insert([
      { user_id: userId, category: 'plumber', name: 'Mike Rodriguez', company_name: 'Rodriguez Plumbing Co.', phone: '555-123-4567', email: 'mike@rodriguez-plumbing.example.com', is_primary: true, notes: 'Reliable, available 24/7 for emergencies', hourly_rate: 85, rating: 5 },
      { user_id: userId, category: 'electrician', name: 'Sarah Chen', company_name: 'Bright Spark Electric', phone: '555-234-5678', email: 'sarah@brightspark.example.com', is_primary: true, notes: 'Licensed and insured, specializes in older homes', hourly_rate: 95, rating: 5 },
      { user_id: userId, category: 'cleaner', name: 'Maria Santos', company_name: 'Spotless Cleaning Services', phone: '555-345-6789', email: 'maria@spotless.example.com', is_primary: true, notes: 'Turnover specialist, brings own supplies', hourly_rate: 45, rating: 5 },
      { user_id: userId, category: 'handyman', name: 'Tom Wilson', company_name: null, phone: '555-456-7890', email: 'tom.wilson@example.com', is_primary: true, notes: 'Jack of all trades, great for small repairs', hourly_rate: 55, rating: 4 },
      { user_id: userId, category: 'hvac', name: 'Cool Air Systems', company_name: 'Cool Air HVAC', phone: '555-567-8901', email: 'service@coolair.example.com', is_primary: true, notes: 'Annual maintenance contracts available', hourly_rate: 110, rating: 4 },
      { user_id: userId, category: 'locksmith', name: 'Quick Key Locksmith', company_name: 'Quick Key Services', phone: '555-678-9012', email: 'help@quickkey.example.com', is_primary: true, notes: 'Can rekey Schlage smart locks', hourly_rate: 75, rating: 5 },
      { user_id: userId, category: 'other', name: "Patrick O'Brien", company_name: "O'Brien & Sons LLC", phone: '555-789-0123', email: 'patrick.obrien@example.com', is_primary: false, notes: 'Pool service - handles chemicals & filters', hourly_rate: 65, rating: 4 },
    ]).select();

    if (vendorsError) throw new Error(`Failed to create vendors: ${vendorsError.message}`);
    console.log('Created vendors:', vendors?.length || 0);

    // Create Inventory Items
    const inventoryItems = [
      { property_id: properties[0].id, name: 'Samsung Smart Refrigerator', category: 'appliance', location: 'Kitchen', brand: 'Samsung', model: 'RF28R7551SR', purchase_date: '2023-06-15', warranty_expires: '2026-06-15', condition: 'excellent', purchase_price: 2499, replacement_cost: 2699 },
      { property_id: properties[0].id, name: 'LG Washer', category: 'appliance', location: 'Laundry Room', brand: 'LG', model: 'WM4000HWA', purchase_date: '2023-06-15', warranty_expires: '2025-06-15', condition: 'good', purchase_price: 899, replacement_cost: 999 },
      { property_id: properties[0].id, name: 'LG Dryer', category: 'appliance', location: 'Laundry Room', brand: 'LG', model: 'DLEX4000W', serial_number: 'LG-DRY-2023-1234', purchase_date: '2023-06-15', warranty_expires: '2025-06-15', condition: 'good', purchase_price: 799, replacement_cost: 899 },
      { property_id: properties[0].id, name: 'Carrier Central AC', category: 'hvac', location: 'Utility Closet', brand: 'Carrier', model: 'Infinity 26', install_date: '2022-03-10', warranty_expires: '2032-03-10', condition: 'excellent', purchase_price: 8500, replacement_cost: 9500 },
      { property_id: properties[0].id, name: 'Schlage Encode Smart Lock - Front', category: 'structure', location: 'Front Door', brand: 'Schlage', model: 'BE489WB', serial_number: 'SCH-LOCK-001', purchase_date: '2024-01-15', warranty_expires: '2027-01-15', condition: 'excellent', purchase_price: 299, replacement_cost: 329 },
      { property_id: properties[0].id, name: 'Pool Pump - Pentair', category: 'other', location: 'Pool Equipment', brand: 'Pentair', model: 'SuperFlo VS', install_date: '2022-05-01', condition: 'good', purchase_price: 1100, replacement_cost: 1300 },
      { property_id: properties[0].id, name: 'King Bed + Frame', category: 'furniture', location: 'Master Bedroom', brand: 'Sleep Number', condition: 'good', purchase_price: 2200, replacement_cost: 2500, notes: 'Sleep Number i8 with FlexFit base' },
      { property_id: properties[0].id, name: 'Sectional Sofa', category: 'furniture', location: 'Living Room', brand: 'Article', model: 'Sven', condition: 'fair', purchase_price: 1800, replacement_cost: 2100, notes: 'Some wear on cushions, consider replacing in 2025' },
      { property_id: properties[1].id, name: 'GE Dishwasher', category: 'appliance', location: 'Kitchen', brand: 'GE', model: 'GDT665SSNSS', purchase_date: '2024-02-01', warranty_expires: '2026-02-01', condition: 'excellent', purchase_price: 749, replacement_cost: 799 },
      { property_id: properties[1].id, name: 'Mini Split AC - Living Room', category: 'hvac', location: 'Living Room', brand: 'Mitsubishi', model: 'MSZ-GL12NA', condition: 'excellent', purchase_price: 1800, replacement_cost: 2000 },
      { property_id: properties[1].id, name: 'Schlage Encode Smart Lock - Entry', category: 'structure', location: 'Entry Door', brand: 'Schlage', model: 'BE489WB', serial_number: 'SCH-LOCK-002', purchase_date: '2024-01-20', warranty_expires: '2027-01-20', condition: 'excellent', purchase_price: 299, replacement_cost: 329 },
      { property_id: properties[1].id, name: 'Garbage Disposal', category: 'plumbing', location: 'Kitchen Sink', brand: 'InSinkErator', model: 'Badger 5', install_date: '2018-04-15', condition: 'needs_replacement', purchase_price: 89, replacement_cost: 120, notes: 'Making grinding noise, replace soon' },
      { property_id: properties[0].id, name: 'Hot Tub - Jacuzzi J-335', category: 'other', location: 'Back Patio', brand: 'Jacuzzi', model: 'J-335', serial_number: 'JAC-HT-2023-ABC', condition: 'good', purchase_price: 8500, replacement_cost: 9500, notes: 'Chemical balance: pH 7.2-7.6; last serviced 1/15/2026' },
    ];

    const { error: inventoryError } = await supabase.schema('landlord').from('inventory_items').insert(
      inventoryItems.map(item => ({ user_id: userId, ...item }))
    );

    if (inventoryError) throw new Error(`Failed to create inventory: ${inventoryError.message}`);
    console.log('Created inventory items:', inventoryItems.length);

    // Create Contacts
    const { data: contacts, error: contactsError } = await supabase.schema('crm').from('contacts').insert([
      { user_id: userId, first_name: 'Jennifer', last_name: 'Martinez', email: 'jennifer.martinez@example.com', phone: '555-111-2222', contact_types: ['guest'], source: 'airbnb', status: 'active', score: 92 },
      { user_id: userId, first_name: 'David', last_name: 'Kim', email: 'david.kim@example.com', phone: '555-222-3333', contact_types: ['guest'], source: 'vrbo', status: 'active', score: 88 },
      { user_id: userId, first_name: 'Lisa', last_name: 'Thompson', email: 'lisa.t@example.com', phone: '555-333-4444', contact_types: ['tenant'], source: 'furnishedfinder', status: 'active', score: 95 },
      { user_id: userId, first_name: "Mary-Jane", last_name: "O'Connor", email: 'mj.oconnor@example.com', phone: '555-444-5555', contact_types: ['guest'], source: 'direct', status: 'active', score: 85 },
      { user_id: userId, first_name: 'Alexander', last_name: 'Bartholomew-Richardson III', email: 'alex.br3@example.com', phone: '555-555-6666', contact_types: ['guest'], source: 'airbnb', status: 'active', score: 78 },
    ]).select();

    if (contactsError) throw new Error(`Failed to create contacts: ${contactsError.message}`);
    console.log('Created contacts:', contacts?.length || 0);

    // Create Bookings
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const { data: bookings, error: bookingsError } = await supabase.schema('landlord').from('bookings').insert([
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![0].id, booking_type: 'reservation', status: 'completed', start_date: lastWeek.toISOString().split('T')[0], end_date: yesterday.toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 3150, source: 'airbnb', notes: 'Family vacation, 4 adults 2 kids' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![1].id, booking_type: 'reservation', status: 'active', start_date: today.toISOString().split('T')[0], end_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 2500, source: 'vrbo' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![3].id, booking_type: 'reservation', status: 'confirmed', start_date: nextWeek.toISOString().split('T')[0], end_date: inTwoWeeks.toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 3600, source: 'direct' },
      { user_id: userId, property_id: properties[1].id, contact_id: contacts![2].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3500, rate_type: 'monthly', total_amount: 21000, source: 'furnishedfinder' },
    ]).select();

    if (bookingsError) throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    console.log('Created bookings:', bookings?.length || 0);

    // Create Maintenance Records
    const { data: maintenance, error: maintenanceError } = await supabase.schema('landlord').from('maintenance_records').insert([
      { user_id: userId, property_id: properties[0].id, work_order_number: 'WO-2026-0001', title: 'Pool Filter Replacement', description: 'Replaced clogged pool filter cartridge discovered during routine maintenance.', category: 'other', status: 'completed', priority: 'medium', vendor_name: "Patrick O'Brien", vendor_phone: '555-789-0123', scheduled_at: lastWeek.toISOString().split('T')[0], completed_at: lastWeek.toISOString().split('T')[0], estimated_cost: 150, actual_cost: 175, charge_to: 'owner' },
      { user_id: userId, property_id: properties[0].id, booking_id: bookings![0].id, work_order_number: 'WO-2026-0002', title: 'Broken Window - Guest Damage', description: 'Guest accidentally broke bedroom window. Glass replacement and labor.', category: 'structural', status: 'completed', priority: 'high', vendor_name: 'Tom Wilson', vendor_phone: '555-456-7890', scheduled_at: yesterday.toISOString().split('T')[0], completed_at: yesterday.toISOString().split('T')[0], estimated_cost: 300, actual_cost: 350, charge_to: 'guest', is_guest_chargeable: true, guest_charge_amount: 350 },
      { user_id: userId, property_id: properties[1].id, work_order_number: 'WO-2026-0003', title: 'Garbage Disposal Replacement', description: 'Current disposal making loud grinding noise. Replacing with new InSinkErator Badger 5.', category: 'plumbing', status: 'scheduled', priority: 'medium', vendor_name: 'Mike Rodriguez', vendor_phone: '555-123-4567', scheduled_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], estimated_cost: 250, charge_to: 'owner' },
      { user_id: userId, property_id: properties[0].id, work_order_number: 'WO-2026-0004', title: 'AC Not Cooling', description: 'Guest reported AC blowing warm air. HVAC tech dispatched for emergency repair.', category: 'hvac', status: 'in_progress', priority: 'emergency', vendor_name: 'Cool Air Systems', vendor_phone: '555-567-8901', scheduled_at: today.toISOString().split('T')[0], estimated_cost: 400, charge_to: 'warranty', notes: 'Unit still under manufacturer warranty - verify coverage' },
      { user_id: userId, property_id: properties[0].id, work_order_number: 'WO-2026-0005', title: 'Test Work Order', description: "Guest note: Robert'); DROP TABLE property_maintenance;-- said the faucet drips", category: 'plumbing', status: 'reported', priority: 'low', charge_to: 'owner' },
    ]).select();

    if (maintenanceError) throw new Error(`Failed to create maintenance: ${maintenanceError.message}`);
    console.log('Created maintenance records:', maintenance?.length || 0);

    // Create Booking Charges
    const { data: charges, error: chargesError } = await supabase.schema('landlord').from('booking_charges').insert([
      { user_id: userId, booking_id: bookings![0].id, maintenance_id: maintenance![1].id, charge_type: 'damage', description: 'Broken window in master bedroom - replacement required', amount: 350, status: 'approved', notes: 'Guest acknowledged responsibility' },
      { user_id: userId, booking_id: bookings![0].id, charge_type: 'cleaning', description: 'Extended deep cleaning required - excessive mess in kitchen and bathrooms', amount: 150, status: 'pending', notes: 'Cleaner spent 3 extra hours' },
      { user_id: userId, booking_id: bookings![0].id, charge_type: 'missing_item', description: 'Pool towels (3x) not returned', amount: 75, status: 'pending' },
      { user_id: userId, booking_id: bookings![0].id, charge_type: 'late_checkout', description: 'Checked out 2 hours late without prior approval', amount: 100, status: 'disputed', notes: 'Guest claims they had verbal permission from cleaning staff' },
      { user_id: userId, booking_id: bookings![0].id, charge_type: 'other', description: 'Multiple minor issues discovered during checkout inspection including: small stain on living room carpet near fireplace, scratches on kitchen counter near stove area, missing TV remote batteries (replaced), loose cabinet handle in bathroom that required tightening, and general wear beyond normal use on outdoor furniture cushions.', amount: 200, status: 'pending', notes: 'Itemized list available upon request' },
    ]).select();

    if (chargesError) throw new Error(`Failed to create charges: ${chargesError.message}`);
    console.log('Created booking charges:', charges?.length || 0);

    // Create Deposit Settlement
    const { error: settlementError } = await supabase.schema('landlord').from('deposit_settlements').insert({
      user_id: userId,
      booking_id: bookings![0].id,
      deposit_held: 1000,
      total_deductions: 350,
      amount_returned: 650,
      status: 'pending',
      notes: 'Awaiting guest approval on pending charges before final settlement',
    });

    if (settlementError) throw new Error(`Failed to create settlement: ${settlementError.message}`);
    console.log('Created deposit settlement');

    // Create Turnovers
    const cleanerVendor = vendors?.find(v => v.category === 'cleaner');
    const { error: turnoversError } = await supabase.schema('landlord').from('turnovers').insert([
      { user_id: userId, property_id: properties[0].id, checkout_booking_id: bookings![0].id, checkout_at: yesterday.toISOString(), checkin_at: today.toISOString(), status: 'ready', cleaner_vendor_id: cleanerVendor?.id, cleaning_scheduled_at: yesterday.toISOString(), cleaning_completed_at: yesterday.toISOString(), inspection_completed_at: yesterday.toISOString(), inspection_notes: 'All clear except for window damage noted separately. Property ready for next guest.' },
      { user_id: userId, property_id: properties[0].id, checkout_booking_id: bookings![1].id, checkout_at: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), checkin_at: nextWeek.toISOString(), status: 'pending', cleaner_vendor_id: cleanerVendor?.id, notes: '2-day gap between bookings - schedule deep clean' },
      { user_id: userId, property_id: properties[0].id, checkout_at: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(), checkin_at: new Date(today.getTime() + 20 * 60 * 60 * 1000).toISOString(), status: 'cleaning_scheduled', cleaner_vendor_id: cleanerVendor?.id, cleaning_scheduled_at: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), ai_messages: [{ to: 'maria@spotless.example.com', channel: 'email', sent_at: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(), response: 'Confirmed for tomorrow at 10am' }, { to: '555-345-6789', channel: 'sms', sent_at: new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString(), response: 'On my way!' }] },
    ]);

    if (turnoversError) throw new Error(`Failed to create turnovers: ${turnoversError.message}`);
    console.log('Created turnovers');

    // Create Guest Templates
    const { error: templatesError } = await supabase.schema('landlord').from('guest_templates').insert([
      { user_id: userId, name: 'Check-in Instructions', template_type: 'check_in_instructions', subject: 'Check-in Instructions for {{property_name}}', body: 'Hi {{guest_name}}!\n\nWelcome to {{property_name}}! Here are your check-in details:\n\nAddress: {{property_address}}\nCheck-in: {{check_in_date}} at {{check_in_time}}\nAccess Code: {{access_code}}\n\nWiFi: {{wifi_name}} / {{wifi_password}}\n\nPlease let me know if you have any questions!\n\nBest,\n{{host_name}}', channel: 'email', is_active: true },
      { user_id: userId, name: 'Checkout Reminder', template_type: 'checkout_reminder', subject: 'Checkout Reminder - {{property_name}}', body: 'Hi {{guest_name}},\n\nJust a friendly reminder that checkout is tomorrow at {{check_out_time}}.\n\nBefore you leave:\n- Please start the dishwasher\n- Leave used towels in the bathroom\n- Take out any trash\n- Lock the door (it will auto-lock)\n\nThank you for staying with us! Safe travels!\n\n{{host_name}}', channel: 'email', is_active: true },
      { user_id: userId, name: 'House Rules', template_type: 'house_rules', subject: 'House Rules - {{property_name}}', body: 'House Rules:\n\n1. No smoking inside\n2. No parties or events\n3. Quiet hours: 10pm - 8am\n4. Max occupancy: {{max_guests}} guests\n5. Pets must be approved in advance\n\nPool/Hot Tub Hours: 8am - 10pm\n\nThank you for respecting our home!', channel: 'email', is_active: true },
    ]);

    if (templatesError) throw new Error(`Failed to create templates: ${templatesError.message}`);
    console.log('Created guest templates');

    // Create Conversations
    const { data: convos, error: convosError } = await supabase.schema('landlord').from('conversations').insert([
      { user_id: userId, contact_id: contacts![0].id, property_id: properties[0].id, channel: 'email', status: 'active', is_ai_enabled: true, message_count: 4, last_message_at: yesterday.toISOString() },
      { user_id: userId, contact_id: contacts![1].id, property_id: properties[0].id, channel: 'sms', status: 'active', is_ai_enabled: true, message_count: 3, last_message_at: today.toISOString() },
    ]).select();

    if (convosError) throw new Error(`Failed to create conversations: ${convosError.message}`);
    console.log('Created conversations:', convos?.length || 0);

    // Add messages
    if (convos && convos.length > 0) {
      const { error: messagesError } = await supabase.schema('landlord').from('messages').insert([
        { conversation_id: convos[0].id, direction: 'inbound', content: 'Hi, we had a great stay! Quick question about the security deposit refund.', content_type: 'text', sent_by: 'contact' },
        { conversation_id: convos[0].id, direction: 'outbound', content: 'Thank you for staying with us! I\'m reviewing the checkout inspection now and will process the deposit within 7 days.', content_type: 'text', sent_by: 'ai', ai_confidence: 92 },
        { conversation_id: convos[0].id, direction: 'inbound', content: 'About the window - that was an accident. Is there any way to work out a payment plan?', content_type: 'text', sent_by: 'contact' },
        { conversation_id: convos[0].id, direction: 'outbound', content: 'I understand accidents happen. The repair cost was $350. I can deduct it from your deposit or we can discuss other options. Would you like to chat about this?', content_type: 'text', sent_by: 'user' },
        { conversation_id: convos[1].id, direction: 'inbound', content: 'Hey! Just checked in. The place is amazing!', content_type: 'text', sent_by: 'contact' },
        { conversation_id: convos[1].id, direction: 'outbound', content: 'So glad to hear that! Let me know if you need anything during your stay.', content_type: 'text', sent_by: 'ai', ai_confidence: 95 },
        { conversation_id: convos[1].id, direction: 'inbound', content: 'The AC seems to be blowing warm air?', content_type: 'text', sent_by: 'contact' },
      ]);
      if (messagesError) throw new Error(`Failed to create messages: ${messagesError.message}`);
      console.log('Created messages');
    }

    console.log('Full Property Manager scenario completed successfully!');
  },
};
