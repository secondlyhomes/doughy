// src/features/settings/services/landlord-seeder/scenarios/room-by-room.ts
// Room-by-room property seed scenario: 1 property with 4 individual rooms

import { supabase } from '@/lib/supabase';

import type { SeedScenario } from '../types';
import { getPropertyImage } from '../constants';
import { ensureUserHasWorkspace } from '../helpers';

export const seedRoomByRoom: SeedScenario = {
  id: 'room-by-room',
  name: 'Room-by-Room Property',
  description: '1 property with 4 individual rooms, mixed occupancy',
  seed: async (userId: string) => {
    await ensureUserHasWorkspace(userId);

    // Create a room-by-room property
    const { data: property, error: propertyError } = await supabase.from('landlord_properties').insert({
      user_id: userId,
      name: 'Shared House - Westside',
      address: '555 College Ave',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      property_type: 'single_family',
      rental_type: 'mtr',
      bedrooms: 4,
      bathrooms: 2,
      square_feet: 2000,
      base_rate: 0, // Individual room rates
      rate_type: 'monthly',
      is_room_by_room_enabled: true,
      status: 'active',
      amenities: ['wifi', 'parking', 'laundry', 'kitchen', 'yard'],
      primary_image_url: getPropertyImage(4),
    }).select().single();

    if (propertyError) {
      console.error('Error creating property:', propertyError);
      throw new Error(`Failed to create property: ${propertyError.message}`);
    }
    if (!property) {
      throw new Error('Property was not created');
    }
    console.log('Created property:', property.id);

    // Create rooms
    const { data: rooms, error: roomsError } = await supabase.from('landlord_rooms').insert([
      { property_id: property.id, name: 'Room A - Master', monthly_rate: 1200, status: 'occupied', is_private_bath: true, amenities: ['closet', 'ceiling_fan'] },
      { property_id: property.id, name: 'Room B - Corner', monthly_rate: 950, status: 'occupied', is_private_bath: false, amenities: ['closet', 'window_ac'] },
      { property_id: property.id, name: 'Room C - Garden View', monthly_rate: 900, status: 'available', is_private_bath: false, amenities: ['closet'] },
      { property_id: property.id, name: 'Room D - Cozy', monthly_rate: 850, status: 'available', is_private_bath: false, amenities: ['closet'] },
    ]).select();

    if (roomsError) {
      console.error('Error creating rooms:', roomsError);
      throw new Error(`Failed to create rooms: ${roomsError.message}`);
    }
    if (!rooms || rooms.length === 0) {
      throw new Error('Rooms were not created');
    }
    console.log('Created rooms:', rooms.length);

    // Create tenants for occupied rooms
    const { data: contacts, error: contactsError } = await supabase.from('crm_contacts').insert([
      { user_id: userId, first_name: 'Chris', last_name: 'Park', email: 'chris.p@email.com', contact_types: ['tenant'], source: 'furnishedfinder', status: 'active', score: 88 },
      { user_id: userId, first_name: 'Sam', last_name: 'Torres', email: 'sam.t@email.com', contact_types: ['tenant'], source: 'craigslist', status: 'active', score: 82 },
      { user_id: userId, first_name: 'Pat', last_name: 'Quinn', email: 'pat.q@email.com', contact_types: ['lead'], source: 'facebook', status: 'qualified', score: 75 },
    ]).select();

    if (contactsError) {
      console.error('Error creating contacts:', contactsError);
      throw new Error(`Failed to create contacts: ${contactsError.message}`);
    }
    if (!contacts || contacts.length === 0) {
      throw new Error('Contacts were not created');
    }
    console.log('Created contacts:', contacts.length);

    // Create bookings for occupied rooms
    const today = new Date();
    const { error: bookingsError } = await supabase.from('landlord_bookings').insert([
      { user_id: userId, property_id: property.id, room_id: rooms[0].id, contact_id: contacts[0].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1200, rate_type: 'monthly', total_amount: 14400, source: 'furnishedfinder' },
      { user_id: userId, property_id: property.id, room_id: rooms[1].id, contact_id: contacts[1].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 950, rate_type: 'monthly', total_amount: 5700, source: 'craigslist' },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create inquiry conversation for available room
    const { data: convo, error: convoError } = await supabase.from('landlord_conversations').insert({
      user_id: userId,
      contact_id: contacts[2].id,
      property_id: property.id,
      channel: 'email',
      status: 'active',
      is_ai_enabled: true,
      message_count: 2,
      last_message_at: new Date().toISOString(),
    }).select().single();

    if (convoError) {
      console.error('Error creating conversation:', convoError);
      throw new Error(`Failed to create conversation: ${convoError.message}`);
    }
    if (!convo) {
      throw new Error('Conversation was not created');
    }
    console.log('Created conversation:', convo.id);

    const { error: messagesError } = await supabase.from('landlord_messages').insert([
      { conversation_id: convo.id, direction: 'inbound', content: 'Hi, I saw Room C is available. Is it still open? I\'m looking for a 6-month stay.', content_type: 'text', sent_by: 'contact' },
      { conversation_id: convo.id, direction: 'outbound', content: 'Yes, Room C is available! It\'s $900/month and has a nice garden view. When would you like to move in?', content_type: 'text', sent_by: 'ai', ai_confidence: 91 },
    ]);
    if (messagesError) {
      console.error('Error creating messages:', messagesError);
      throw new Error(`Failed to create messages: ${messagesError.message}`);
    }
    console.log('Created messages');
  },
};
