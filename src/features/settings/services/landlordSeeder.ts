// src/features/settings/services/landlordSeeder.ts
// Seeder service for Landlord platform test data
// Easily add/remove seed scenarios for testing

import { supabase } from '@/lib/supabase';

// ============================================
// Unsplash Property Images for Rentals
// ============================================
const RENTAL_PROPERTY_IMAGES = [
  // Original 10
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Modern white house
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', // Suburban home
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', // Luxury home exterior
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', // Modern house pool
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', // Contemporary home
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', // Ranch style home
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80', // Classic American home
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', // Luxury villa
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80', // Modern minimal
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', // Craftsman home
  // Additional variety (20 more)
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80', // Two-story home
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', // Colonial style
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', // Red door house
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80', // Modern architecture
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&q=80', // Brick home
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80', // Mediterranean villa
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80', // Modern luxury
  'https://images.unsplash.com/photo-1599423300746-b62533397364?w=800&q=80', // Beach house
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&q=80', // Townhouse
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80', // Elegant home
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80', // Modern front
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', // Cozy apartment
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', // Apartment interior
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80', // Condo exterior
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80', // Urban apartment
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80', // Farmhouse style
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80', // Country home
  'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?w=800&q=80', // A-frame cabin
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80', // Cozy cottage
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80', // Modern kitchen
];

// Get a random property image
function getPropertyImage(index: number = 0): string {
  return RENTAL_PROPERTY_IMAGES[index % RENTAL_PROPERTY_IMAGES.length];
}

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

/**
 * Ensures the user has a workspace for multi-tenancy.
 * Creates one if it doesn't exist.
 */
async function ensureUserHasWorkspace(userId: string): Promise<string> {
  // Check if user already has a workspace
  const { data: existingMembership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (existingMembership?.workspace_id) {
    return existingMembership.workspace_id;
  }

  // Create a new workspace for the user
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      name: 'My Workspace',
      owner_id: userId,
    })
    .select()
    .single();

  if (workspaceError) throw new Error(`Failed to create workspace: ${workspaceError.message}`);

  // Add user as owner member
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'owner',
      is_active: true,
    });

  if (memberError) throw new Error(`Failed to add workspace member: ${memberError.message}`);

  console.log('Created workspace:', workspace.id);
  return workspace.id;
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
    .from('landlord_conversations')
    .select('id')
    .eq('user_id', userId);
  const conversationIds = conversations?.map(c => c.id) || [];

  // Get property IDs first for deleting dependent records
  const { data: properties } = await supabase
    .from('landlord_properties')
    .select('id')
    .eq('user_id', userId);
  const propertyIds = properties?.map(p => p.id) || [];

  // Get booking IDs for deleting charges and settlements
  const { data: bookings } = await supabase
    .from('landlord_bookings')
    .select('id')
    .eq('user_id', userId);
  const bookingIds = bookings?.map(b => b.id) || [];

  // Delete in order to respect foreign keys
  // Collect all errors but continue to delete as much as possible
  if (conversationIds.length > 0) {
    const { error: messagesError } = await supabase.from('landlord_messages').delete().in('conversation_id', conversationIds);
    if (messagesError) {
      errors.push({ table: 'rental_messages', message: messagesError.message });
    }
  }

  const { error: aiQueueError } = await supabase.from('landlord_ai_queue_items').delete().eq('user_id', userId);
  if (aiQueueError) {
    errors.push({ table: 'rental_ai_queue', message: aiQueueError.message });
  }

  const { error: conversationsError } = await supabase.from('landlord_conversations').delete().eq('user_id', userId);
  if (conversationsError) {
    errors.push({ table: 'rental_conversations', message: conversationsError.message });
  }

  // Delete booking-related data (charges, settlements)
  if (bookingIds.length > 0) {
    const { error: chargesError } = await supabase.from('landlord_booking_charges').delete().in('booking_id', bookingIds);
    if (chargesError) {
      errors.push({ table: 'booking_charges', message: chargesError.message });
    }

    const { error: settlementsError } = await supabase.from('landlord_deposit_settlements').delete().in('booking_id', bookingIds);
    if (settlementsError) {
      errors.push({ table: 'deposit_settlements', message: settlementsError.message });
    }
  }

  // Delete turnovers (tied to properties/bookings)
  const { error: turnoversError } = await supabase.from('landlord_turnovers').delete().eq('user_id', userId);
  if (turnoversError) {
    errors.push({ table: 'property_turnovers', message: turnoversError.message });
  }

  // Delete maintenance records
  const { error: maintenanceError } = await supabase.from('landlord_maintenance_records').delete().eq('user_id', userId);
  if (maintenanceError) {
    errors.push({ table: 'property_maintenance', message: maintenanceError.message });
  }

  const { error: bookingsError } = await supabase.from('landlord_bookings').delete().eq('user_id', userId);
  if (bookingsError) {
    errors.push({ table: 'rental_bookings', message: bookingsError.message });
  }

  // Delete property-related data
  if (propertyIds.length > 0) {
    const { error: roomsError } = await supabase.from('landlord_rooms').delete().in('property_id', propertyIds);
    if (roomsError) {
      errors.push({ table: 'rental_rooms', message: roomsError.message });
    }

    const { error: inventoryError } = await supabase.from('landlord_inventory_items').delete().in('property_id', propertyIds);
    if (inventoryError) {
      errors.push({ table: 'property_inventory', message: inventoryError.message });
    }
  }

  const { error: propertiesError } = await supabase.from('landlord_properties').delete().eq('user_id', userId);
  if (propertiesError) {
    errors.push({ table: 'rental_properties', message: propertiesError.message });
  }

  // Delete global data (vendors, templates)
  const { error: vendorsError } = await supabase.from('landlord_vendors').delete().eq('user_id', userId);
  if (vendorsError) {
    errors.push({ table: 'property_vendors', message: vendorsError.message });
  }

  const { error: templatesError } = await supabase.from('landlord_guest_templates').delete().eq('user_id', userId);
  if (templatesError) {
    errors.push({ table: 'guest_message_templates', message: templatesError.message });
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
    // Ensure user has a workspace (required for RLS)
    await ensureUserHasWorkspace(userId);

    // Create a property
    const { data: property, error: propertyError } = await supabase.from('landlord_properties').insert({
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

const seedBusyLandlord: SeedScenario = {
  id: 'busy',
  name: 'Busy Landlord',
  description: '3 properties, 17 contacts (4 guests, 5 tenants, 8 leads), 9 bookings, 10 conversations with realistic messages',
  seed: async (userId: string) => {
    // Ensure user has a workspace (required for RLS)
    await ensureUserHasWorkspace(userId);

    // Create properties
    const { data: properties, error: propertiesError } = await supabase.from('landlord_properties').insert([
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
        primary_image_url: getPropertyImage(1),
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
        primary_image_url: getPropertyImage(2),
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
        primary_image_url: getPropertyImage(3),
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

    // Create many contacts - mix of guests, tenants (residents), and leads
    // Using 'metadata' JSONB column for additional notes since crm_contacts doesn't have a 'notes' text column
    const contactsData = [
      // STR Guests (past and upcoming)
      { firstName: 'Alex', lastName: 'Rivera', email: 'alex.r@email.com', phone: '+1 555-0201', types: ['guest'], source: 'airbnb', status: 'active', score: 88, tags: ['returning_guest'] },
      { firstName: 'Jordan', lastName: 'Smith', email: 'jordan.s@email.com', phone: '+1 555-0202', types: ['guest'], source: 'airbnb', status: 'active', score: 75, tags: [] },
      { firstName: 'Jamie', lastName: 'Garcia', email: 'jamie.g@email.com', phone: '+1 555-0206', types: ['guest'], source: 'direct', status: 'active', score: 78, tags: ['direct_booking'] },
      { firstName: 'Avery', lastName: 'Nguyen', email: 'avery.n@email.com', phone: '+1 555-0211', types: ['guest'], source: 'vrbo', status: 'active', score: 92, tags: ['vrbo'] },

      // MTR/LTR Tenants (Residents) - active leases
      { firstName: 'Casey', lastName: 'Williams', email: 'casey.w@email.com', phone: '+1 555-0204', types: ['tenant'], source: 'zillow', status: 'active', score: 95, tags: ['model_tenant', 'pet_owner'], metadata: { notes: 'Excellent tenant, always pays early. Has a small dog named Max.', pet: 'small dog', move_in_date: '2024-06-01' } },
      { firstName: 'Drew', lastName: 'Anderson', email: 'drew.a@email.com', phone: '+1 555-0208', types: ['tenant'], source: 'turbotenant', status: 'active', score: 91, tags: ['travel_nurse', 'mtr'], metadata: { notes: 'Travel nurse on 3-month contract at Seton Medical.', profession: 'travel_nurse', employer: 'Seton Medical' } },
      { firstName: 'Sam', lastName: 'Patel', email: 'sam.patel@email.com', phone: '+1 555-0212', types: ['tenant'], source: 'furnishedfinder', status: 'active', score: 88, tags: ['medical', 'mtr'], metadata: { notes: 'Medical resident, very reliable. Quiet hours important.', profession: 'medical_resident', hospital: "St. David's" } },
      { firstName: 'Charlie', lastName: 'Thompson', email: 'charlie.t@email.com', phone: '+1 555-0213', types: ['tenant'], source: 'zillow', status: 'active', score: 85, tags: ['wfh', 'ltr'], metadata: { notes: 'Works from home, appreciates quiet environment.', profession: 'remote_worker' } },
      { firstName: 'Jesse', lastName: 'Kim', email: 'jesse.kim@email.com', phone: '+1 555-0214', types: ['tenant'], source: 'craigslist', status: 'active', score: 78, tags: ['student', 'cosigner'], metadata: { notes: 'Student at UT Austin. Parents co-signed the lease.', school: 'UT Austin', cosigner: 'parents' } },

      // Leads - various stages of the funnel
      { firstName: 'Taylor', lastName: 'Brown', email: 'taylor.b@email.com', phone: '+1 555-0203', types: ['lead'], source: 'furnishedfinder', status: 'qualified', score: 82, tags: ['travel_nurse', 'hot_lead'], metadata: { notes: 'Looking for 6-month MTR, move-in Feb 1. Has good credit score 750+.', desired_move_in: '2026-02-01', profession: 'travel_nurse' } },
      { firstName: 'Morgan', lastName: 'Lee', email: 'morgan.l@email.com', phone: '+1 555-0205', types: ['lead'], source: 'facebook', status: 'contacted', score: 65, tags: ['cold_lead'], metadata: { notes: 'Inquired about Downtown Loft. Responded once then went quiet. Follow up needed.' } },
      { firstName: 'Riley', lastName: 'Martinez', email: 'riley.m@email.com', phone: '+1 555-0207', types: ['lead'], source: 'craigslist', status: 'new', score: 55, tags: ['budget_conscious'], metadata: { notes: 'Budget seems low for the area. May not qualify.' } },
      { firstName: 'Quinn', lastName: 'Davis', email: 'quinn.d@email.com', phone: '+1 555-0209', types: ['lead'], source: 'turbotenant', status: 'qualified', score: 89, tags: ['corporate', 'hot_lead', 'urgent'], metadata: { notes: 'Corporate relocation from Seattle, company paying. Needs housing ASAP.', company: 'Tech Corp', relocation: true } },
      { firstName: 'Skyler', lastName: 'Johnson', email: 'skyler.j@email.com', phone: '+1 555-0210', types: ['lead'], source: 'zillow', status: 'new', score: 70, tags: [], metadata: { notes: 'First inquiry, needs to schedule showing.' } },
      { firstName: 'Reese', lastName: 'Wilson', email: 'reese.w@email.com', phone: '+1 555-0215', types: ['lead'], source: 'direct', status: 'contacted', score: 72, tags: ['referral'], metadata: { notes: 'Referred by current tenant Casey Williams.', referred_by: 'Casey Williams' } },
      { firstName: 'Blake', lastName: 'Miller', email: 'blake.m@email.com', phone: '+1 555-0216', types: ['lead'], source: 'airbnb', status: 'qualified', score: 80, tags: ['str_to_mtr'], metadata: { notes: 'Loved STR stay, wants to convert to 3-month MTR.', conversion_type: 'str_to_mtr' } },
    ];

    const { data: contacts, error: contactsError } = await supabase.from('crm_contacts').insert(
      contactsData.map(c => ({
        user_id: userId,
        first_name: c.firstName,
        last_name: c.lastName,
        email: c.email,
        phone: c.phone,
        contact_types: c.types,
        source: c.source,
        status: c.status,
        score: c.score,
        tags: c.tags || [],
        metadata: c.metadata || {},
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
    // Contact indices based on contactsData order:
    // 0-3: guests, 4-8: tenants, 9-16: leads
    const today = new Date();
    const { error: bookingsError } = await supabase.from('landlord_bookings').insert([
      // STR Bookings for Downtown Loft (properties[0])
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[0].id, booking_type: 'reservation', status: 'active', start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 950, source: 'airbnb', notes: 'Returning guest, 3rd stay' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[1].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'airbnb' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[2].id, booking_type: 'reservation', status: 'pending', start_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'direct' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[3].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 1400, source: 'vrbo', notes: 'Week-long vacation' },

      // MTR Booking for Suburban Family Home (properties[1]) - travel nurse
      { user_id: userId, property_id: properties[1].id, contact_id: contacts[5].id, booking_type: 'reservation', status: 'active', start_date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3200, rate_type: 'monthly', total_amount: 9600, source: 'furnishedfinder', notes: 'Travel nurse contract, 3 months' },
      { user_id: userId, property_id: properties[1].id, contact_id: contacts[6].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 140 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3200, rate_type: 'monthly', total_amount: 9600, source: 'furnishedfinder', notes: 'Medical resident' },

      // LTR Leases for Cozy Studio (properties[2]) - long-term tenants
      { user_id: userId, property_id: properties[2].id, contact_id: contacts[4].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 185 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1100, rate_type: 'monthly', total_amount: 13200, deposit: 1100, deposit_status: 'received', source: 'zillow', notes: 'Annual lease, model tenant' },

      // Completed/past bookings for history
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[0].id, booking_type: 'reservation', status: 'completed', start_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 1050, source: 'airbnb', notes: 'Previous stay - excellent guest' },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create conversations - mix of guest inquiries, tenant communications, and lead nurturing
    // Contact indices: 0-3 guests, 4-8 tenants, 9-16 leads
    const conversationData = [
      // Active guest conversations
      { contactIdx: 0, propertyIdx: 0, channel: 'email', status: 'active', is_ai_enabled: true },
      { contactIdx: 1, propertyIdx: 0, channel: 'sms', status: 'active', is_ai_enabled: true },
      { contactIdx: 3, propertyIdx: 0, channel: 'whatsapp', status: 'active', is_ai_enabled: false },

      // Tenant communications
      { contactIdx: 4, propertyIdx: 2, channel: 'email', status: 'active', is_ai_enabled: false }, // Casey - model tenant
      { contactIdx: 5, propertyIdx: 1, channel: 'sms', status: 'active', is_ai_enabled: true }, // Drew - travel nurse

      // Lead conversations - different stages
      { contactIdx: 9, propertyIdx: 1, channel: 'email', status: 'active', is_ai_enabled: true }, // Taylor - qualified MTR lead
      { contactIdx: 10, propertyIdx: 0, channel: 'email', status: 'active', is_ai_enabled: true }, // Morgan - went quiet
      { contactIdx: 11, propertyIdx: 2, channel: 'sms', status: 'active', is_ai_enabled: true }, // Riley - new lead
      { contactIdx: 12, propertyIdx: 1, channel: 'email', status: 'active', is_ai_enabled: true }, // Quinn - corporate
      { contactIdx: 13, propertyIdx: 0, channel: 'whatsapp', status: 'active', is_ai_enabled: true }, // Skyler - needs showing
    ];

    const { data: convos, error: convosError } = await supabase.from('landlord_conversations').insert(
      conversationData.map((c, i) => ({
        user_id: userId,
        contact_id: contacts[c.contactIdx].id,
        property_id: properties[c.propertyIdx].id,
        channel: c.channel,
        status: c.status,
        is_ai_enabled: c.is_ai_enabled,
        message_count: 3 + i,
        last_message_at: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(), // Staggered times
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

    // Add realistic messages to conversations
    const messageTemplates = [
      // Guest conversation (checking in soon)
      [
        { direction: 'inbound', content: 'Hi! I\'m so excited for my stay next week. Quick question - what\'s the wifi password?', sent_by: 'contact' },
        { direction: 'outbound', content: 'We\'re excited to host you! The wifi password will be in the welcome book on the kitchen counter. Network is "DowntownLoft" and password is "Welcome2024".', sent_by: 'ai', ai_confidence: 95 },
        { direction: 'inbound', content: 'Perfect, thank you! Is early check-in possible?', sent_by: 'contact' },
      ],
      // Guest SMS
      [
        { direction: 'inbound', content: 'Hey can I get late checkout?', sent_by: 'contact' },
        { direction: 'outbound', content: 'I can do 1pm checkout for a $50 fee. Does that work?', sent_by: 'ai', ai_confidence: 88 },
        { direction: 'inbound', content: 'Yes that\'s great thanks!', sent_by: 'contact' },
      ],
      // WhatsApp guest
      [
        { direction: 'inbound', content: 'Is the hot tub working?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Yes, it\'s ready for you! Just let me know if you need help with the controls.', sent_by: 'user' },
      ],
      // Tenant conversation - maintenance request
      [
        { direction: 'inbound', content: 'Hey, the garbage disposal is making a weird noise again. Not urgent but wanted to let you know.', sent_by: 'contact' },
        { direction: 'outbound', content: 'Thanks for letting me know Casey! I\'ll schedule the plumber to take a look. Does Tuesday between 10-12 work for access?', sent_by: 'user' },
        { direction: 'inbound', content: 'Tuesday works. I WFH so I\'ll be here.', sent_by: 'contact' },
      ],
      // Travel nurse tenant
      [
        { direction: 'inbound', content: 'Just wanted to confirm my lease extension went through?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Yes Drew, you\'re all set for another 3 months! Same rate. I\'ll send the updated agreement today.', sent_by: 'user' },
        { direction: 'inbound', content: 'Awesome, love the place. Thanks!', sent_by: 'contact' },
      ],
      // Qualified MTR lead - Taylor
      [
        { direction: 'inbound', content: 'Hi, I saw your listing on FurnishedFinder. Is the Suburban Family Home still available for Feb 1?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Taylor! Yes, it\'s available starting Feb 1. It\'s a 4BR/3BA home perfect for travel nurses. Monthly rate is $3,200 all utilities included. Would you like to schedule a showing?', sent_by: 'ai', ai_confidence: 94 },
        { direction: 'inbound', content: 'That sounds perfect! I\'m a travel nurse starting at Dell Seton. Can I see it this weekend?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Saturday at 2pm works great. I\'ll send you the address and confirmation. Looking forward to meeting you!', sent_by: 'user' },
      ],
      // Cold lead - Morgan (went quiet)
      [
        { direction: 'inbound', content: 'How much is the downtown loft?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Morgan! The Downtown Loft is $175/night for short stays or $4,500/month for stays 30+ days. Which timeframe were you thinking?', sent_by: 'ai', ai_confidence: 91 },
        // No response - lead went cold
      ],
      // New lead - Riley (budget concerns)
      [
        { direction: 'inbound', content: 'do u have anything under $800/mo?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi! Our most affordable option is the Cozy Studio at $1,100/month. It\'s a great deal for the downtown location with utilities included. Would you like more details?', sent_by: 'ai', ai_confidence: 85 },
      ],
      // Corporate lead - Quinn (high priority)
      [
        { direction: 'inbound', content: 'Hello, I\'m relocating to Austin for work and my company will be handling payment. I need housing starting next week ideally. Do you have anything for 3-6 months?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Quinn! Welcome to Austin. I have the Suburban Family Home available - it\'s perfect for corporate relocations. 4BR/3BA, $3,200/month, fully furnished. We accept corporate payments and can do a quick move-in. When can you tour?', sent_by: 'ai', ai_confidence: 96 },
        { direction: 'inbound', content: 'Can we do a video tour today? I\'m still in Seattle but need to lock something down.', sent_by: 'contact' },
      ],
      // New lead - Skyler (needs showing)
      [
        { direction: 'inbound', content: 'Hi, interested in the downtown loft. Is it still available?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Skyler! Yes, the Downtown Loft is available. It\'s a modern 1BR/1BA at $175/night or $4,500/month. Would you like to schedule a tour?', sent_by: 'ai', ai_confidence: 92 },
      ],
    ];

    for (let i = 0; i < convos.length; i++) {
      const messages = messageTemplates[i] || messageTemplates[0];
      const { error: msgError } = await supabase.from('landlord_messages').insert(
        messages.map(m => ({
          conversation_id: convos[i].id,
          direction: m.direction,
          content: m.content,
          content_type: 'text',
          sent_by: m.sent_by,
          ai_confidence: 'ai_confidence' in m ? m.ai_confidence : null,
        }))
      );
      if (msgError) {
        console.error(`Error creating messages for conversation ${convos[i].id}:`, msgError);
        throw new Error(`Failed to create messages: ${msgError.message}`);
      }
    }
    console.log('Created messages for all conversations');

    // Add pending AI responses - for various conversation types
    const { error: aiQueueError } = await supabase.from('landlord_ai_queue_items').insert([
      // Guest asking about early check-in
      { user_id: userId, conversation_id: convos[0].id, suggested_response: 'I can offer early check-in at 1pm for a $25 fee, or complimentary at 2pm if the previous guest checks out on time. Which would you prefer?', confidence: 92, reasoning: 'Guest requested early check-in', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },

      // Qualified lead - showing confirmation
      { user_id: userId, conversation_id: convos[5].id, suggested_response: 'Perfect! I\'ll see you Saturday at 2pm at 789 Oak Lane. I\'ll send you a calendar invite and directions. Please bring a valid ID for the application if you decide to move forward!', confidence: 96, reasoning: 'Lead confirmed showing time', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },

      // Follow-up for cold lead
      { user_id: userId, conversation_id: convos[6].id, suggested_response: 'Hi Morgan! Just checking in - were you still interested in the Downtown Loft? I have some availability coming up and wanted to give you first dibs. Let me know if you\'d like to schedule a tour!', confidence: 78, reasoning: 'Lead went quiet, time for follow-up', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },

      // Corporate lead - video tour
      { user_id: userId, conversation_id: convos[8].id, suggested_response: 'Absolutely! I can do a FaceTime or Zoom tour at 3pm CST today. I\'ll walk you through every room. If you like it, we can do the application and lease signing digitally. What video platform works best for you?', confidence: 95, reasoning: 'Corporate lead wants video tour', status: 'pending', expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() }, // Expires sooner - time sensitive

      // New lead response
      { user_id: userId, conversation_id: convos[9].id, suggested_response: 'Great! How about Saturday at 11am or Sunday at 2pm? The loft is in a great location downtown, walking distance to 6th Street and the Capitol. I think you\'ll love it!', confidence: 91, reasoning: 'Lead interested, needs showing scheduled', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
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
    // Ensure user has a workspace (required for RLS)
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

    // Create rooms (note: column is 'is_private_bath' not 'has_private_bath')
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

// ============================================
// Full Property Manager Scenario
// Includes all landlord features with test data
// ============================================

const seedFullPropertyManager: SeedScenario = {
  id: 'full-manager',
  name: 'Full Property Manager',
  description: '2 properties with inventory, vendors, maintenance, turnovers, charges, edge cases',
  seed: async (userId: string) => {
    // Ensure user has a workspace (required for RLS)
    await ensureUserHasWorkspace(userId);

    // =====================
    // 1. Create Properties
    // =====================
    const { data: properties, error: propertiesError } = await supabase.from('landlord_properties').insert([
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
      throw new Error(`Failed to create properties: ${propertiesError.message} (code: ${propertiesError.code}, details: ${propertiesError.details})`);
    }
    if (!properties || properties.length < 2) throw new Error('Properties were not created');
    console.log('Created properties:', properties.length);

    // =====================
    // 2. Create Vendors (Global)
    // =====================
    const { data: vendors, error: vendorsError } = await supabase.from('landlord_vendors').insert([
      {
        user_id: userId,
        category: 'plumber',
        name: 'Mike Rodriguez',
        company_name: 'Rodriguez Plumbing Co.',
        phone: '555-123-4567',
        email: 'mike@rodriguez-plumbing.example.com',
        is_primary: true,
        notes: 'Reliable, available 24/7 for emergencies',
        hourly_rate: 85,
        rating: 5,
      },
      {
        user_id: userId,
        category: 'electrician',
        name: 'Sarah Chen',
        company_name: 'Bright Spark Electric',
        phone: '555-234-5678',
        email: 'sarah@brightspark.example.com',
        is_primary: true,
        notes: 'Licensed and insured, specializes in older homes',
        hourly_rate: 95,
        rating: 5,
      },
      {
        user_id: userId,
        category: 'cleaner',
        name: 'Maria Santos',
        company_name: 'Spotless Cleaning Services',
        phone: '555-345-6789',
        email: 'maria@spotless.example.com',
        is_primary: true,
        notes: 'Turnover specialist, brings own supplies',
        hourly_rate: 45,
        rating: 5,
      },
      {
        user_id: userId,
        category: 'handyman',
        name: 'Tom Wilson',
        company_name: null,
        phone: '555-456-7890',
        email: 'tom.wilson@example.com',
        is_primary: true,
        notes: 'Jack of all trades, great for small repairs',
        hourly_rate: 55,
        rating: 4,
      },
      {
        user_id: userId,
        category: 'hvac',
        name: 'Cool Air Systems',
        company_name: 'Cool Air HVAC',
        phone: '555-567-8901',
        email: 'service@coolair.example.com',
        is_primary: true,
        notes: 'Annual maintenance contracts available',
        hourly_rate: 110,
        rating: 4,
      },
      {
        user_id: userId,
        category: 'locksmith',
        name: 'Quick Key Locksmith',
        company_name: 'Quick Key Services',
        phone: '555-678-9012',
        email: 'help@quickkey.example.com',
        is_primary: true,
        notes: 'Can rekey Schlage smart locks',
        hourly_rate: 75,
        rating: 5,
      },
      // Edge case: Special characters in name/notes
      {
        user_id: userId,
        category: 'other',
        name: "Patrick O'Brien",
        company_name: 'O\'Brien & Sons LLC',
        phone: '555-789-0123',
        email: 'patrick.obrien@example.com',
        is_primary: false,
        notes: 'Pool service - handles chemicals & filters; "Best in town" per reviews',
        hourly_rate: 65,
        rating: 4,
      },
    ]).select();

    if (vendorsError) throw new Error(`Failed to create vendors: ${vendorsError.message}`);
    console.log('Created vendors:', vendors?.length || 0);

    // =====================
    // 3. Create Property Inventory
    // =====================
    const inventoryItems = [
      // Oceanview Villa inventory
      { property_id: properties[0].id, name: 'Samsung Smart Refrigerator', category: 'appliance', location: 'Kitchen', brand: 'Samsung', model: 'RF28R7551SR', purchase_date: '2023-06-15', warranty_expires: '2026-06-15', condition: 'excellent', purchase_price: 2499, replacement_cost: 2699 },
      { property_id: properties[0].id, name: 'LG Washer', category: 'appliance', location: 'Laundry Room', brand: 'LG', model: 'WM4000HWA', purchase_date: '2023-06-15', warranty_expires: '2025-06-15', condition: 'good', purchase_price: 899, replacement_cost: 999 },
      { property_id: properties[0].id, name: 'LG Dryer', category: 'appliance', location: 'Laundry Room', brand: 'LG', model: 'DLEX4000W', serial_number: 'LG-DRY-2023-1234', purchase_date: '2023-06-15', warranty_expires: '2025-06-15', condition: 'good', purchase_price: 799, replacement_cost: 899 },
      { property_id: properties[0].id, name: 'Carrier Central AC', category: 'hvac', location: 'Utility Closet', brand: 'Carrier', model: 'Infinity 26', install_date: '2022-03-10', warranty_expires: '2032-03-10', condition: 'excellent', purchase_price: 8500, replacement_cost: 9500 },
      { property_id: properties[0].id, name: 'Rheem Water Heater (50 gal)', category: 'plumbing', location: 'Garage', brand: 'Rheem', model: 'XE50T10HD50U0', serial_number: 'RH-WH-2021-5678', install_date: '2021-09-20', warranty_expires: '2027-09-20', condition: 'good', purchase_price: 1200, replacement_cost: 1500 },
      { property_id: properties[0].id, name: 'Schlage Encode Smart Lock - Front', category: 'structure', location: 'Front Door', brand: 'Schlage', model: 'BE489WB', serial_number: 'SCH-LOCK-001', purchase_date: '2024-01-15', warranty_expires: '2027-01-15', condition: 'excellent', purchase_price: 299, replacement_cost: 329 },
      { property_id: properties[0].id, name: 'Pool Pump - Pentair', category: 'other', location: 'Pool Equipment', brand: 'Pentair', model: 'SuperFlo VS', install_date: '2022-05-01', condition: 'good', purchase_price: 1100, replacement_cost: 1300 },
      { property_id: properties[0].id, name: 'King Bed + Frame', category: 'furniture', location: 'Master Bedroom', brand: 'Sleep Number', condition: 'good', purchase_price: 2200, replacement_cost: 2500, notes: 'Sleep Number i8 with FlexFit base' },
      { property_id: properties[0].id, name: 'Sectional Sofa', category: 'furniture', location: 'Living Room', brand: 'Article', model: 'Sven', condition: 'fair', purchase_price: 1800, replacement_cost: 2100, notes: 'Some wear on cushions, consider replacing in 2025' },
      // Downtown Condo inventory
      { property_id: properties[1].id, name: 'GE Dishwasher', category: 'appliance', location: 'Kitchen', brand: 'GE', model: 'GDT665SSNSS', purchase_date: '2024-02-01', warranty_expires: '2026-02-01', condition: 'excellent', purchase_price: 749, replacement_cost: 799 },
      { property_id: properties[1].id, name: 'Mini Split AC - Living Room', category: 'hvac', location: 'Living Room', brand: 'Mitsubishi', model: 'MSZ-GL12NA', condition: 'excellent', purchase_price: 1800, replacement_cost: 2000 },
      { property_id: properties[1].id, name: 'Schlage Encode Smart Lock - Entry', category: 'structure', location: 'Entry Door', brand: 'Schlage', model: 'BE489WB', serial_number: 'SCH-LOCK-002', purchase_date: '2024-01-20', warranty_expires: '2027-01-20', condition: 'excellent', purchase_price: 299, replacement_cost: 329 },
      // Edge case: Item with needs_replacement condition
      { property_id: properties[1].id, name: 'Garbage Disposal', category: 'plumbing', location: 'Kitchen Sink', brand: 'InSinkErator', model: 'Badger 5', install_date: '2018-04-15', condition: 'needs_replacement', purchase_price: 89, replacement_cost: 120, notes: 'Making grinding noise, replace soon' },
      // Edge case: Special characters in notes
      { property_id: properties[0].id, name: 'Hot Tub - Jacuzzi J-335', category: 'other', location: 'Back Patio', brand: 'Jacuzzi', model: 'J-335', serial_number: 'JAC-HT-2023-ABC', condition: 'good', purchase_price: 8500, replacement_cost: 9500, notes: 'Chemical balance: pH 7.2-7.6; "ProClear" filter system; last serviced 1/15/2026' },
    ];

    const { error: inventoryError } = await supabase.from('landlord_inventory_items').insert(
      inventoryItems.map(item => ({
        user_id: userId,
        ...item,
      }))
    );

    if (inventoryError) throw new Error(`Failed to create inventory: ${inventoryError.message}`);
    console.log('Created inventory items:', inventoryItems.length);

    // =====================
    // 4. Create Contacts (Guests)
    // =====================
    const { data: contacts, error: contactsError } = await supabase.from('crm_contacts').insert([
      { user_id: userId, first_name: 'Jennifer', last_name: 'Martinez', email: 'jennifer.martinez@example.com', phone: '555-111-2222', contact_types: ['guest'], source: 'airbnb', status: 'active', score: 92 },
      { user_id: userId, first_name: 'David', last_name: 'Kim', email: 'david.kim@example.com', phone: '555-222-3333', contact_types: ['guest'], source: 'vrbo', status: 'active', score: 88 },
      { user_id: userId, first_name: 'Lisa', last_name: 'Thompson', email: 'lisa.t@example.com', phone: '555-333-4444', contact_types: ['tenant'], source: 'furnishedfinder', status: 'active', score: 95 },
      // Edge case: Name with special characters
      { user_id: userId, first_name: "Mary-Jane", last_name: "O'Connor", email: 'mj.oconnor@example.com', phone: '555-444-5555', contact_types: ['guest'], source: 'direct', status: 'active', score: 85 },
      // Edge case: Very long name
      { user_id: userId, first_name: 'Alexander', last_name: 'Bartholomew-Richardson III', email: 'alex.br3@example.com', phone: '555-555-6666', contact_types: ['guest'], source: 'airbnb', status: 'active', score: 78 },
    ]).select();

    if (contactsError) throw new Error(`Failed to create contacts: ${contactsError.message}`);
    console.log('Created contacts:', contacts?.length || 0);

    // =====================
    // 5. Create Bookings
    // =====================
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const { data: bookings, error: bookingsError } = await supabase.from('landlord_bookings').insert([
      // Completed booking (for charges/settlement testing)
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![0].id, booking_type: 'reservation', status: 'completed', start_date: lastWeek.toISOString().split('T')[0], end_date: yesterday.toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 3150, source: 'airbnb', notes: 'Family vacation, 4 adults 2 kids' },
      // Active booking
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![1].id, booking_type: 'reservation', status: 'active', start_date: today.toISOString().split('T')[0], end_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 2500, source: 'vrbo' },
      // Upcoming booking
      { user_id: userId, property_id: properties[0].id, contact_id: contacts![3].id, booking_type: 'reservation', status: 'confirmed', start_date: nextWeek.toISOString().split('T')[0], end_date: inTwoWeeks.toISOString().split('T')[0], rate: 450, rate_type: 'nightly', total_amount: 3600, source: 'direct' },
      // Long-term booking
      { user_id: userId, property_id: properties[1].id, contact_id: contacts![2].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3500, rate_type: 'monthly', total_amount: 21000, source: 'furnishedfinder' },
    ]).select();

    if (bookingsError) throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    console.log('Created bookings:', bookings?.length || 0);

    // =====================
    // 6. Create Maintenance Records
    // =====================
    const { data: maintenance, error: maintenanceError } = await supabase.from('landlord_maintenance_records').insert([
      // Completed maintenance (for charge linking)
      {
        user_id: userId,
        property_id: properties[0].id,
        work_order_number: 'WO-2026-0001',
        title: 'Pool Filter Replacement',
        description: 'Replaced clogged pool filter cartridge discovered during routine maintenance.',
        category: 'other',
        status: 'completed',
        priority: 'medium',
        vendor_name: "Patrick O'Brien",
        vendor_phone: '555-789-0123',
        scheduled_at: lastWeek.toISOString().split('T')[0],
        completed_at: lastWeek.toISOString().split('T')[0],
        estimated_cost: 150,
        actual_cost: 175,
        charge_to: 'owner',
      },
      // Guest-chargeable maintenance (linked to booking)
      {
        user_id: userId,
        property_id: properties[0].id,
        booking_id: bookings![0].id,
        work_order_number: 'WO-2026-0002',
        title: 'Broken Window - Guest Damage',
        description: 'Guest accidentally broke bedroom window. Glass replacement and labor.',
        category: 'structural',
        status: 'completed',
        priority: 'high',
        vendor_name: 'Tom Wilson',
        vendor_phone: '555-456-7890',
        scheduled_at: yesterday.toISOString().split('T')[0],
        completed_at: yesterday.toISOString().split('T')[0],
        estimated_cost: 300,
        actual_cost: 350,
        charge_to: 'guest',
        is_guest_chargeable: true,
        guest_charge_amount: 350,
      },
      // In-progress maintenance
      {
        user_id: userId,
        property_id: properties[1].id,
        work_order_number: 'WO-2026-0003',
        title: 'Garbage Disposal Replacement',
        description: 'Current disposal making loud grinding noise. Replacing with new InSinkErator Badger 5.',
        category: 'plumbing',
        status: 'scheduled',
        priority: 'medium',
        vendor_name: 'Mike Rodriguez',
        vendor_phone: '555-123-4567',
        scheduled_at: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimated_cost: 250,
        charge_to: 'owner',
      },
      // Emergency maintenance
      {
        user_id: userId,
        property_id: properties[0].id,
        work_order_number: 'WO-2026-0004',
        title: 'AC Not Cooling',
        description: 'Guest reported AC blowing warm air. HVAC tech dispatched for emergency repair.',
        category: 'hvac',
        status: 'in_progress',
        priority: 'emergency',
        vendor_name: 'Cool Air Systems',
        vendor_phone: '555-567-8901',
        scheduled_at: today.toISOString().split('T')[0],
        estimated_cost: 400,
        charge_to: 'warranty',
        notes: 'Unit still under manufacturer warranty - verify coverage',
      },
      // Edge case: SQL injection attempt in description (should be safely stored)
      {
        user_id: userId,
        property_id: properties[0].id,
        work_order_number: 'WO-2026-0005',
        title: 'Test Work Order',
        description: "Guest note: Robert'); DROP TABLE property_maintenance;-- said the faucet drips",
        category: 'plumbing',
        status: 'reported',
        priority: 'low',
        charge_to: 'owner',
      },
    ]).select();

    if (maintenanceError) throw new Error(`Failed to create maintenance: ${maintenanceError.message}`);
    console.log('Created maintenance records:', maintenance?.length || 0);

    // =====================
    // 7. Create Booking Charges
    // =====================
    const { data: charges, error: chargesError } = await supabase.from('landlord_booking_charges').insert([
      // Linked to maintenance
      {
        user_id: userId,
        booking_id: bookings![0].id,
        maintenance_id: maintenance![1].id,
        charge_type: 'damage',
        description: 'Broken window in master bedroom - replacement required',
        amount: 350,
        status: 'approved',
        notes: 'Guest acknowledged responsibility',
      },
      // Extra cleaning charge
      {
        user_id: userId,
        booking_id: bookings![0].id,
        charge_type: 'cleaning',
        description: 'Extended deep cleaning required - excessive mess in kitchen and bathrooms',
        amount: 150,
        status: 'pending',
        notes: 'Cleaner spent 3 extra hours',
      },
      // Missing item
      {
        user_id: userId,
        booking_id: bookings![0].id,
        charge_type: 'missing_item',
        description: 'Pool towels (3x) not returned',
        amount: 75,
        status: 'pending',
      },
      // Disputed charge
      {
        user_id: userId,
        booking_id: bookings![0].id,
        charge_type: 'late_checkout',
        description: 'Checked out 2 hours late without prior approval',
        amount: 100,
        status: 'disputed',
        notes: 'Guest claims they had verbal permission from cleaning staff',
      },
      // Edge case: Very long description
      {
        user_id: userId,
        booking_id: bookings![0].id,
        charge_type: 'other',
        description: 'Multiple minor issues discovered during checkout inspection including: small stain on living room carpet near fireplace, scratches on kitchen counter near stove area, missing TV remote batteries (replaced), loose cabinet handle in bathroom that required tightening, and general wear beyond normal use on outdoor furniture cushions.',
        amount: 200,
        status: 'pending',
        notes: 'Itemized list available upon request',
      },
    ]).select();

    if (chargesError) throw new Error(`Failed to create charges: ${chargesError.message}`);
    console.log('Created booking charges:', charges?.length || 0);

    // =====================
    // 8. Create Deposit Settlement
    // =====================
    const { error: settlementError } = await supabase.from('landlord_deposit_settlements').insert({
      user_id: userId,
      booking_id: bookings![0].id,
      deposit_held: 1000,
      total_deductions: 350, // Only approved charges
      amount_returned: 650,
      status: 'pending',
      notes: 'Awaiting guest approval on pending charges before final settlement',
    });

    if (settlementError) throw new Error(`Failed to create settlement: ${settlementError.message}`);
    console.log('Created deposit settlement');

    // =====================
    // 9. Create Turnovers
    // =====================
    const cleanerVendor = vendors?.find(v => v.category === 'cleaner');

    const { error: turnoversError } = await supabase.from('landlord_turnovers').insert([
      // Completed turnover (past)
      {
        user_id: userId,
        property_id: properties[0].id,
        checkout_booking_id: bookings![0].id,
        checkout_at: yesterday.toISOString(),
        checkin_at: today.toISOString(),
        status: 'ready',
        cleaner_vendor_id: cleanerVendor?.id,
        cleaning_scheduled_at: yesterday.toISOString(),
        cleaning_completed_at: yesterday.toISOString(),
        inspection_completed_at: yesterday.toISOString(),
        inspection_notes: 'All clear except for window damage noted separately. Property ready for next guest.',
      },
      // Upcoming turnover
      {
        user_id: userId,
        property_id: properties[0].id,
        checkout_booking_id: bookings![1].id,
        checkout_at: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        checkin_at: nextWeek.toISOString(),
        status: 'pending',
        cleaner_vendor_id: cleanerVendor?.id,
        notes: '2-day gap between bookings - schedule deep clean',
      },
      // Cleaning in progress
      {
        user_id: userId,
        property_id: properties[0].id,
        checkout_at: new Date(today.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        checkin_at: new Date(today.getTime() + 20 * 60 * 60 * 1000).toISOString(), // Tonight
        status: 'cleaning_scheduled',
        cleaner_vendor_id: cleanerVendor?.id,
        cleaning_scheduled_at: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        ai_messages: [
          { to: 'maria@spotless.example.com', channel: 'email', sent_at: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(), response: 'Confirmed for tomorrow at 10am' },
          { to: '555-345-6789', channel: 'sms', sent_at: new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString(), response: 'On my way!' },
        ],
      },
    ]);

    if (turnoversError) throw new Error(`Failed to create turnovers: ${turnoversError.message}`);
    console.log('Created turnovers');

    // =====================
    // 10. Create Guest Templates
    // =====================
    const { error: templatesError } = await supabase.from('landlord_guest_templates').insert([
      {
        user_id: userId,
        name: 'Check-in Instructions',
        template_type: 'check_in_instructions',
        subject: 'Check-in Instructions for {{property_name}}',
        body: 'Hi {{guest_name}}!\n\nWelcome to {{property_name}}! Here are your check-in details:\n\nAddress: {{property_address}}\nCheck-in: {{check_in_date}} at {{check_in_time}}\nAccess Code: {{access_code}}\n\nWiFi: {{wifi_name}} / {{wifi_password}}\n\nPlease let me know if you have any questions!\n\nBest,\n{{host_name}}',
        channel: 'email',
        is_active: true,
      },
      {
        user_id: userId,
        name: 'Checkout Reminder',
        template_type: 'checkout_reminder',
        subject: 'Checkout Reminder - {{property_name}}',
        body: 'Hi {{guest_name}},\n\nJust a friendly reminder that checkout is tomorrow at {{check_out_time}}.\n\nBefore you leave:\n- Please start the dishwasher\n- Leave used towels in the bathroom\n- Take out any trash\n- Lock the door (it will auto-lock)\n\nThank you for staying with us! Safe travels!\n\n{{host_name}}',
        channel: 'email',
        is_active: true,
      },
      {
        user_id: userId,
        name: 'House Rules',
        template_type: 'house_rules',
        subject: 'House Rules - {{property_name}}',
        body: 'House Rules:\n\n1. No smoking inside\n2. No parties or events\n3. Quiet hours: 10pm - 8am\n4. Max occupancy: {{max_guests}} guests\n5. Pets must be approved in advance\n\nPool/Hot Tub Hours: 8am - 10pm\n\nThank you for respecting our home!',
        channel: 'email',
        is_active: true,
      },
    ]);

    if (templatesError) throw new Error(`Failed to create templates: ${templatesError.message}`);
    console.log('Created guest templates');

    // =====================
    // 11. Create Conversations
    // =====================
    const { data: convos, error: convosError } = await supabase.from('landlord_conversations').insert([
      { user_id: userId, contact_id: contacts![0].id, property_id: properties[0].id, channel: 'email', status: 'active', is_ai_enabled: true, message_count: 4, last_message_at: yesterday.toISOString() },
      { user_id: userId, contact_id: contacts![1].id, property_id: properties[0].id, channel: 'sms', status: 'active', is_ai_enabled: true, message_count: 3, last_message_at: today.toISOString() },
    ]).select();

    if (convosError) throw new Error(`Failed to create conversations: ${convosError.message}`);
    console.log('Created conversations:', convos?.length || 0);

    // Add messages
    if (convos && convos.length > 0) {
      const { error: messagesError } = await supabase.from('landlord_messages').insert([
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

// ============================================
// Edge Cases & Security Test Scenario
// ============================================

const seedEdgeCases: SeedScenario = {
  id: 'edge-cases',
  name: 'Edge Cases & Security Tests',
  description: 'Special characters, SQL injection attempts, boundary values',
  seed: async (userId: string) => {
    // Ensure user has a workspace (required for RLS)
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

    // Edge case charges (note: column is 'charge_type' not 'type')
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

// ============================================
// Export All Scenarios
// ============================================

export const seedScenarios: SeedScenario[] = [
  seedStarterLandlord,
  seedBusyLandlord,
  seedRoomByRoom,
  seedFullPropertyManager,
  seedEdgeCases,
];

export async function runSeedScenario(scenarioId: string): Promise<void> {
  const userId = await getUserId();
  const scenario = seedScenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  await scenario.seed(userId);
}
