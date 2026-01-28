// src/features/settings/services/landlordSeeder.ts
// Seeder service for Landlord platform test data
// Easily add/remove seed scenarios for testing

import { supabase } from '@/lib/supabase';

export interface SeedScenario {
  id: string;
  name: string;
  description: string;
  seed: (userId: string) => Promise<void>;
}

// ============================================
// Helper Functions
// ============================================

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ============================================
// Clear All Landlord Data
// ============================================

export interface ClearDataResult {
  success: boolean;
  errors: { table: string; message: string }[];
}

export async function clearAllLandlordData(): Promise<ClearDataResult> {
  const errors: { table: string; message: string }[] = [];
  const userId = await getUserId();

  // Get conversation IDs first for deleting messages
  const { data: conversations } = await supabase
    .from('rental_conversations')
    .select('id')
    .eq('user_id', userId);
  const conversationIds = conversations?.map(c => c.id) || [];

  // Get property IDs first for deleting rooms
  const { data: properties } = await supabase
    .from('rental_properties')
    .select('id')
    .eq('user_id', userId);
  const propertyIds = properties?.map(p => p.id) || [];

  // Delete in order to respect foreign keys
  // Collect all errors but continue to delete as much as possible
  if (conversationIds.length > 0) {
    const { error: messagesError } = await supabase.from('rental_messages').delete().in('conversation_id', conversationIds);
    if (messagesError) {
      errors.push({ table: 'rental_messages', message: messagesError.message });
    }
  }

  const { error: aiQueueError } = await supabase.from('rental_ai_queue').delete().eq('user_id', userId);
  if (aiQueueError) {
    errors.push({ table: 'rental_ai_queue', message: aiQueueError.message });
  }

  const { error: conversationsError } = await supabase.from('rental_conversations').delete().eq('user_id', userId);
  if (conversationsError) {
    errors.push({ table: 'rental_conversations', message: conversationsError.message });
  }

  const { error: bookingsError } = await supabase.from('rental_bookings').delete().eq('user_id', userId);
  if (bookingsError) {
    errors.push({ table: 'rental_bookings', message: bookingsError.message });
  }

  if (propertyIds.length > 0) {
    const { error: roomsError } = await supabase.from('rental_rooms').delete().in('property_id', propertyIds);
    if (roomsError) {
      errors.push({ table: 'rental_rooms', message: roomsError.message });
    }
  }

  const { error: propertiesError } = await supabase.from('rental_properties').delete().eq('user_id', userId);
  if (propertiesError) {
    errors.push({ table: 'rental_properties', message: propertiesError.message });
  }

  // Clear contacts - need to bypass soft delete trigger
  // The crm_contacts table has a soft_delete trigger that converts DELETE to UPDATE is_deleted=true
  // To do a HARD delete: first set is_deleted=true (so trigger won't fire), then DELETE
  try {
    const { data: contacts, error: fetchError } = await supabase
      .from('crm_contacts')
      .select('id, contact_types')
      .eq('user_id', userId);

    if (fetchError) {
      errors.push({ table: 'crm_contacts', message: `Failed to fetch: ${fetchError.message}` });
    } else {
      // Filter to landlord-specific contacts (guest, tenant, or lead)
      const landlordContactIds = (contacts || [])
        .filter(c => {
          const types = c.contact_types || [];
          return types.includes('guest') || types.includes('tenant') || types.includes('lead');
        })
        .map(c => c.id);

      if (landlordContactIds.length > 0) {
        // Step 1: Mark as soft-deleted first (this bypasses the trigger on actual DELETE)
        const { error: softDeleteError } = await supabase
          .from('crm_contacts')
          .update({ is_deleted: true })
          .in('id', landlordContactIds);

        if (softDeleteError) {
          errors.push({ table: 'crm_contacts', message: `Soft delete failed: ${softDeleteError.message}` });
        } else {
          // Step 2: Now DELETE will actually remove the rows (trigger won't fire when is_deleted=true)
          const { error: deleteError } = await supabase
            .from('crm_contacts')
            .delete()
            .in('id', landlordContactIds);

          if (deleteError) {
            errors.push({ table: 'crm_contacts', message: `Hard delete failed: ${deleteError.message}` });
          }
        }
      }
    }
  } catch (err) {
    errors.push({ table: 'crm_contacts', message: err instanceof Error ? err.message : 'Unknown error' });
  }

  // Return detailed result
  if (errors.length > 0) {
    console.error('Errors during data clearing:', errors);
    throw new Error(`Failed to clear some data: ${errors.map(e => `${e.table}: ${e.message}`).join('; ')}`);
  }

  return { success: true, errors: [] };
}

// ============================================
// Seed Scenarios
// ============================================

const seedStarterLandlord: SeedScenario = {
  id: 'starter',
  name: 'Starter Landlord',
  description: '1 STR property, 2 upcoming bookings, 3 conversations',
  seed: async (userId: string) => {
    // Create a property
    const { data: property, error: propertyError } = await supabase.from('rental_properties').insert({
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
    }).select().single();

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

    const { error: bookingsError } = await supabase.from('rental_bookings').insert([
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
    const { data: convos, error: convosError } = await supabase.from('rental_conversations').insert([
      {
        user_id: userId,
        contact_id: contacts[0].id,
        property_id: property.id,
        channel: 'email',
        status: 'active',
        ai_enabled: true,
        message_count: 3,
        last_message_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        contact_id: contacts[1].id,
        property_id: property.id,
        channel: 'email',
        status: 'active',
        ai_enabled: true,
        message_count: 2,
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: userId,
        contact_id: contacts[2].id,
        property_id: property.id,
        channel: 'whatsapp',
        status: 'active',
        ai_enabled: false,
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
    const { error: messagesError } = await supabase.from('rental_messages').insert([
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
    const { error: aiQueueError } = await supabase.from('rental_ai_queue').insert({
      user_id: userId,
      conversation_id: convos[0].id,
      suggested_response: 'I\'d be happy to share the details! The Beach House Retreat features 3 bedrooms, 2 bathrooms, a private pool, and is just a 5-minute walk from the beach. The nightly rate is $250 with a $150 cleaning fee. Would you like to proceed with a booking?',
      confidence: 92,
      reason: 'Guest asked for property details',
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

const seedBusyLandlord: SeedScenario = {
  id: 'busy',
  name: 'Busy Landlord',
  description: '3 properties (STR, MTR, LTR), 8 bookings, 10 conversations, pending AI responses',
  seed: async (userId: string) => {
    // Create properties
    const { data: properties, error: propertiesError } = await supabase.from('rental_properties').insert([
      {
        user_id: userId,
        name: 'Downtown Loft',
        address: '456 Main Street, Unit 12A',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        property_type: 'condo',
        rental_type: 'str',
        bedrooms: 1,
        bathrooms: 1,
        square_feet: 850,
        base_rate: 175,
        rate_type: 'nightly',
        cleaning_fee: 75,
        status: 'active',
        amenities: ['wifi', 'gym', 'parking', 'ac'],
      },
      {
        user_id: userId,
        name: 'Suburban Family Home',
        address: '789 Oak Lane',
        city: 'Austin',
        state: 'TX',
        zip: '78745',
        property_type: 'single_family',
        rental_type: 'mtr',
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 2400,
        base_rate: 3200,
        rate_type: 'monthly',
        security_deposit: 3200,
        status: 'active',
        amenities: ['wifi', 'garage', 'yard', 'washer_dryer'],
      },
      {
        user_id: userId,
        name: 'Cozy Studio',
        address: '321 Park Ave, Apt 5',
        city: 'Austin',
        state: 'TX',
        zip: '78702',
        property_type: 'apartment',
        rental_type: 'ltr',
        bedrooms: 0,
        bathrooms: 1,
        square_feet: 450,
        base_rate: 1100,
        rate_type: 'monthly',
        security_deposit: 1100,
        status: 'active',
        amenities: ['wifi', 'ac', 'laundry_in_building'],
      },
    ]).select();

    if (propertiesError) {
      console.error('Error creating properties:', propertiesError);
      throw new Error(`Failed to create properties: ${propertiesError.message}`);
    }
    if (!properties || properties.length < 3) {
      throw new Error(`Expected 3 properties but only ${properties?.length || 0} were created`);
    }
    console.log('Created properties:', properties.length);

    // Create many contacts
    const contactsData = [
      { firstName: 'Alex', lastName: 'Rivera', email: 'alex.r@email.com', types: ['guest'], source: 'airbnb', score: 88 },
      { firstName: 'Jordan', lastName: 'Smith', email: 'jordan.s@email.com', types: ['guest'], source: 'airbnb', score: 75 },
      { firstName: 'Taylor', lastName: 'Brown', email: 'taylor.b@email.com', types: ['lead'], source: 'furnishedfinder', score: 82 },
      { firstName: 'Casey', lastName: 'Williams', email: 'casey.w@email.com', types: ['tenant'], source: 'zillow', score: 95 },
      { firstName: 'Morgan', lastName: 'Lee', email: 'morgan.l@email.com', types: ['lead'], source: 'facebook', score: 65 },
      { firstName: 'Jamie', lastName: 'Garcia', email: 'jamie.g@email.com', types: ['guest'], source: 'direct', score: 78 },
      { firstName: 'Riley', lastName: 'Martinez', email: 'riley.m@email.com', types: ['lead'], source: 'craigslist', score: 55 },
      { firstName: 'Drew', lastName: 'Anderson', email: 'drew.a@email.com', types: ['tenant'], source: 'turbotenant', score: 91 },
    ];

    const { data: contacts, error: contactsError } = await supabase.from('crm_contacts').insert(
      contactsData.map(c => ({
        user_id: userId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        contact_types: c.types,
        source: c.source,
        status: 'active',
        score: c.score,
      }))
    ).select();

    if (contactsError) {
      console.error('Error creating contacts:', contactsError);
      throw new Error(`Failed to create contacts: ${contactsError.message}`);
    }
    if (!contacts || contacts.length === 0) {
      throw new Error('Contacts were not created');
    }
    console.log('Created contacts:', contacts.length);

    // Create bookings across properties
    const today = new Date();
    const { error: bookingsError } = await supabase.from('rental_bookings').insert([
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[0].id, booking_type: 'reservation', status: 'active', start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 950, source: 'airbnb' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[1].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'airbnb' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[5].id, booking_type: 'reservation', status: 'pending', start_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'direct' },
      { user_id: userId, property_id: properties[1].id, contact_id: contacts[2].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3200, rate_type: 'monthly', total_amount: 9600, source: 'furnishedfinder' },
      { user_id: userId, property_id: properties[2].id, contact_id: contacts[3].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 305 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1100, rate_type: 'monthly', total_amount: 13200, source: 'zillow' },
      { user_id: userId, property_id: properties[2].id, contact_id: contacts[7].id, booking_type: 'lease', status: 'pending', start_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 410 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1100, rate_type: 'monthly', total_amount: 13200, source: 'turbotenant' },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create conversations
    const channels = ['email', 'email', 'whatsapp', 'sms', 'telegram'];
    const { data: convos, error: convosError } = await supabase.from('rental_conversations').insert(
      contacts.slice(0, 6).map((contact, i) => ({
        user_id: userId,
        contact_id: contact.id,
        property_id: properties[i % 3].id,
        channel: channels[i % 5],
        status: i < 4 ? 'active' : 'resolved',
        ai_enabled: i % 2 === 0,
        message_count: 3 + i,
        last_message_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      }))
    ).select();

    if (convosError) {
      console.error('Error creating conversations:', convosError);
      throw new Error(`Failed to create conversations: ${convosError.message}`);
    }
    if (!convos || convos.length === 0) {
      throw new Error('Conversations were not created');
    }
    console.log('Created conversations:', convos.length);

    // Add messages to conversations
    for (const convo of convos) {
      const { error: msgError } = await supabase.from('rental_messages').insert([
        { conversation_id: convo.id, direction: 'inbound', content: 'Hi, I have a question about the property.', content_type: 'text', sent_by: 'contact' },
        { conversation_id: convo.id, direction: 'outbound', content: 'Of course! How can I help you?', content_type: 'text', sent_by: 'ai', ai_confidence: 90 },
        { conversation_id: convo.id, direction: 'inbound', content: 'Is parking included?', content_type: 'text', sent_by: 'contact' },
      ]);
      if (msgError) {
        console.error(`Error creating messages for conversation ${convo.id}:`, msgError);
        throw new Error(`Failed to create messages: ${msgError.message}`);
      }
    }
    console.log('Created messages for all conversations');

    // Add pending AI responses
    const { error: aiQueueError } = await supabase.from('rental_ai_queue').insert([
      { user_id: userId, conversation_id: convos[0].id, suggested_response: 'Yes, parking is included! We have one dedicated spot in the garage.', confidence: 94, status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { user_id: userId, conversation_id: convos[2].id, suggested_response: 'The property has street parking available. Most guests find it easy to park nearby.', confidence: 87, status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    ]);
    if (aiQueueError) {
      console.error('Error creating AI queue entries:', aiQueueError);
      throw new Error(`Failed to create AI queue entries: ${aiQueueError.message}`);
    }
    console.log('Created AI queue entries');
  },
};

const seedRoomByRoom: SeedScenario = {
  id: 'room-by-room',
  name: 'Room-by-Room Property',
  description: '1 property with 4 individual rooms, mixed occupancy',
  seed: async (userId: string) => {
    // Create a room-by-room property
    const { data: property, error: propertyError } = await supabase.from('rental_properties').insert({
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
      room_by_room_enabled: true,
      status: 'active',
      amenities: ['wifi', 'parking', 'laundry', 'kitchen', 'yard'],
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
    const { data: rooms, error: roomsError } = await supabase.from('rental_rooms').insert([
      { property_id: property.id, name: 'Room A - Master', monthly_rate: 1200, status: 'occupied', has_private_bath: true, amenities: ['closet', 'ceiling_fan'] },
      { property_id: property.id, name: 'Room B - Corner', monthly_rate: 950, status: 'occupied', has_private_bath: false, amenities: ['closet', 'window_ac'] },
      { property_id: property.id, name: 'Room C - Garden View', monthly_rate: 900, status: 'available', has_private_bath: false, amenities: ['closet'] },
      { property_id: property.id, name: 'Room D - Cozy', monthly_rate: 850, status: 'available', has_private_bath: false, amenities: ['closet'] },
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
    const { error: bookingsError } = await supabase.from('rental_bookings').insert([
      { user_id: userId, property_id: property.id, room_id: rooms[0].id, contact_id: contacts[0].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 275 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1200, rate_type: 'monthly', total_amount: 14400, source: 'furnishedfinder' },
      { user_id: userId, property_id: property.id, room_id: rooms[1].id, contact_id: contacts[1].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 950, rate_type: 'monthly', total_amount: 5700, source: 'craigslist' },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create inquiry conversation for available room
    const { data: convo, error: convoError } = await supabase.from('rental_conversations').insert({
      user_id: userId,
      contact_id: contacts[2].id,
      property_id: property.id,
      channel: 'email',
      status: 'active',
      ai_enabled: true,
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

    const { error: messagesError } = await supabase.from('rental_messages').insert([
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

// ============================================
// Export All Scenarios
// ============================================

export const seedScenarios: SeedScenario[] = [
  seedStarterLandlord,
  seedBusyLandlord,
  seedRoomByRoom,
];

export async function runSeedScenario(scenarioId: string): Promise<void> {
  const userId = await getUserId();
  const scenario = seedScenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  await scenario.seed(userId);
}
