// src/features/settings/services/landlord-seeder/scenarios/starter.ts
// Starter landlord seed scenario: 1 STR property, 2 bookings, 3 conversations

import { supabase } from '@/lib/supabase';

import type { SeedScenario } from '../types';
import { getPropertyImage } from '../constants';
import { ensureUserHasWorkspace } from '../helpers';

export const seedStarterLandlord: SeedScenario = {
  id: 'starter',
  name: 'Starter Landlord',
  description: '1 STR property, 2 upcoming bookings, 3 conversations',
  seed: async (userId: string) => {
    await ensureUserHasWorkspace(userId);

    // Create a property
    const { data: property, error: propertyError } = await supabase
      .from('landlord_properties')
      .insert({
        user_id: userId,
        name: 'Beach House Retreat',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip: '33139',
        property_type: 'single_family',
        rental_type: 'str',
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 1800,
        base_rate: 250,
        rate_type: 'nightly',
        cleaning_fee: 150,
        security_deposit: 500,
        status: 'active',
        amenities: ['wifi', 'pool', 'parking', 'ac', 'kitchen'],
        primary_image_url: getPropertyImage(0),
      })
      .select()
      .single();

    if (propertyError) {
      console.error('Error creating property:', propertyError);
      throw new Error(`Failed to create property: ${propertyError.message}`);
    }
    if (!property) throw new Error('Property was not created');
    console.log('Created property:', property.id);

    // Create contacts
    const { data: contacts, error: contactsError } = await supabase.from('crm_contacts').insert([
      {
        user_id: userId,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '+1 555-0101',
        contact_types: ['guest'],
        source: 'airbnb',
        status: 'active',
        score: 85,
      },
      {
        user_id: userId,
        first_name: 'Mike',
        last_name: 'Chen',
        email: 'mike.chen@email.com',
        phone: '+1 555-0102',
        contact_types: ['lead'],
        source: 'furnishedfinder',
        status: 'qualified',
        score: 72,
      },
      {
        user_id: userId,
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.d@email.com',
        phone: '+1 555-0103',
        contact_types: ['guest'],
        source: 'direct',
        status: 'active',
        score: 90,
      },
    ]).select();

    if (contactsError) {
      console.error('Error creating contacts:', contactsError);
      throw new Error(`Failed to create contacts: ${contactsError.message}`);
    }
    if (!contacts || contacts.length < 3) throw new Error('Contacts were not created');
    console.log('Created contacts:', contacts.length);

    // Create bookings
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: bookingsError } = await supabase.from('landlord_bookings').insert([
      {
        user_id: userId,
        property_id: property.id,
        contact_id: contacts[0].id,
        booking_type: 'reservation',
        status: 'confirmed',
        start_date: nextWeek.toISOString().split('T')[0],
        end_date: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: 250,
        rate_type: 'nightly',
        total_amount: 1400,
        source: 'airbnb',
      },
      {
        user_id: userId,
        property_id: property.id,
        contact_id: contacts[2].id,
        booking_type: 'reservation',
        status: 'pending',
        start_date: nextMonth.toISOString().split('T')[0],
        end_date: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rate: 250,
        rate_type: 'nightly',
        total_amount: 900,
        source: 'direct',
      },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create conversations
    const { data: convos, error: convosError } = await supabase.from('landlord_conversations').insert([
      {
        user_id: userId,
        contact_id: contacts[0].id,
        property_id: property.id,
        channel: 'email',
        status: 'active',
        is_ai_enabled: true,
        message_count: 3,
        last_message_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        contact_id: contacts[1].id,
        property_id: property.id,
        channel: 'email',
        status: 'active',
        is_ai_enabled: true,
        message_count: 2,
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        contact_id: contacts[2].id,
        property_id: property.id,
        channel: 'whatsapp',
        status: 'active',
        is_ai_enabled: false,
        message_count: 5,
        last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ]).select();

    if (convosError) {
      console.error('Error creating conversations:', convosError);
      throw new Error(`Failed to create conversations: ${convosError.message}`);
    }
    if (!convos) throw new Error('Conversations were not created');
    console.log('Created conversations:', convos.length);

    // Create messages for each conversation
    const { error: messagesError } = await supabase.from('landlord_messages').insert([
      // Convo 1 - Airbnb guest
      { conversation_id: convos[0].id, direction: 'inbound', content: 'Hi! Is your beach house available next week?', content_type: 'text', sent_by: 'contact' },
      { conversation_id: convos[0].id, direction: 'outbound', content: 'Yes it is! Would you like me to send you the details?', content_type: 'text', sent_by: 'ai', ai_confidence: 95 },
      { conversation_id: convos[0].id, direction: 'inbound', content: 'That would be great, thanks!', content_type: 'text', sent_by: 'contact' },
      // Convo 2 - FurnishedFinder lead
      { conversation_id: convos[1].id, direction: 'inbound', content: 'Looking for a 3-month stay starting February. What are your rates?', content_type: 'text', sent_by: 'contact' },
      { conversation_id: convos[1].id, direction: 'outbound', content: 'For a 3-month stay, we offer a discounted rate of $4,500/month. This includes all utilities.', content_type: 'text', sent_by: 'ai', ai_confidence: 88 },
      // Convo 3 - Direct WhatsApp
      { conversation_id: convos[2].id, direction: 'inbound', content: 'Hey! Just checking - is early check-in possible?', content_type: 'text', sent_by: 'contact' },
      { conversation_id: convos[2].id, direction: 'outbound', content: 'Let me check with the cleaning team and get back to you.', content_type: 'text', sent_by: 'user' },
      { conversation_id: convos[2].id, direction: 'inbound', content: 'Awesome, thank you!', content_type: 'text', sent_by: 'contact' },
    ]);
    if (messagesError) {
      console.error('Error creating messages:', messagesError);
      throw new Error(`Failed to create messages: ${messagesError.message}`);
    }
    console.log('Created messages');

    // Create a pending AI response
    const { error: aiQueueError } = await supabase.from('landlord_ai_queue_items').insert({
      user_id: userId,
      conversation_id: convos[0].id,
      suggested_response: 'I\'d be happy to share the details! The Beach House Retreat features 3 bedrooms, 2 bathrooms, a private pool, and is just a 5-minute walk from the beach. The nightly rate is $250 with a $150 cleaning fee. Would you like to proceed with a booking?',
      confidence: 92,
      reasoning: 'Guest asked for property details',
      status: 'pending',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    if (aiQueueError) {
      console.error('Error creating AI queue entry:', aiQueueError);
      throw new Error(`Failed to create AI queue entry: ${aiQueueError.message}`);
    }
    console.log('Created AI queue entry');
  },
};
