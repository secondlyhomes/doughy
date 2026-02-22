// src/features/settings/services/landlord-seeder/scenarios/busy.ts
// Busy landlord seed scenario: 3 properties, 17 contacts, 9 bookings, 10 conversations

import { supabase } from '@/lib/supabase';

import type { SeedScenario } from '../types';
import { getPropertyImage } from '../constants';
import { ensureUserHasWorkspace } from '../helpers';

export const seedBusyLandlord: SeedScenario = {
  id: 'busy',
  name: 'Busy Landlord',
  description: '3 properties, 17 contacts (4 guests, 5 tenants, 8 leads), 9 bookings, 10 conversations with realistic messages',
  seed: async (userId: string) => {
    await ensureUserHasWorkspace(userId);

    // Create properties
    const { data: properties, error: propertiesError } = await supabase.schema('landlord').from('properties').insert([
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

    // Create contacts - mix of guests, tenants, and leads
    const contactsData = [
      // STR Guests (past and upcoming)
      { firstName: 'Alex', lastName: 'Rivera', email: 'alex.r@email.com', phone: '+1 555-0201', types: ['guest'], source: 'airbnb', status: 'active', score: 88, tags: ['returning_guest'] },
      { firstName: 'Jordan', lastName: 'Smith', email: 'jordan.s@email.com', phone: '+1 555-0202', types: ['guest'], source: 'airbnb', status: 'active', score: 75, tags: [] },
      { firstName: 'Jamie', lastName: 'Garcia', email: 'jamie.g@email.com', phone: '+1 555-0206', types: ['guest'], source: 'direct', status: 'active', score: 78, tags: ['direct_booking'] },
      { firstName: 'Avery', lastName: 'Nguyen', email: 'avery.n@email.com', phone: '+1 555-0211', types: ['guest'], source: 'vrbo', status: 'active', score: 92, tags: ['vrbo'] },

      // MTR/LTR Tenants (Residents)
      { firstName: 'Casey', lastName: 'Williams', email: 'casey.w@email.com', phone: '+1 555-0204', types: ['tenant'], source: 'zillow', status: 'active', score: 95, tags: ['model_tenant', 'pet_owner'], metadata: { notes: 'Excellent tenant, always pays early. Has a small dog named Max.' } },
      { firstName: 'Drew', lastName: 'Anderson', email: 'drew.a@email.com', phone: '+1 555-0208', types: ['tenant'], source: 'turbotenant', status: 'active', score: 91, tags: ['travel_nurse', 'mtr'], metadata: { notes: 'Travel nurse on 3-month contract at Seton Medical.' } },
      { firstName: 'Sam', lastName: 'Patel', email: 'sam.patel@email.com', phone: '+1 555-0212', types: ['tenant'], source: 'furnishedfinder', status: 'active', score: 88, tags: ['medical', 'mtr'], metadata: { notes: 'Medical resident, very reliable. Quiet hours important.' } },
      { firstName: 'Charlie', lastName: 'Thompson', email: 'charlie.t@email.com', phone: '+1 555-0213', types: ['tenant'], source: 'zillow', status: 'active', score: 85, tags: ['wfh', 'ltr'], metadata: { notes: 'Works from home, appreciates quiet environment.' } },
      { firstName: 'Jesse', lastName: 'Kim', email: 'jesse.kim@email.com', phone: '+1 555-0214', types: ['tenant'], source: 'craigslist', status: 'active', score: 78, tags: ['student', 'cosigner'], metadata: { notes: 'Student at UT Austin. Parents co-signed the lease.' } },

      // Leads - various stages
      { firstName: 'Taylor', lastName: 'Brown', email: 'taylor.b@email.com', phone: '+1 555-0203', types: ['lead'], source: 'furnishedfinder', status: 'qualified', score: 82, tags: ['travel_nurse', 'hot_lead'], metadata: { notes: 'Looking for 6-month MTR, move-in Feb 1.' } },
      { firstName: 'Morgan', lastName: 'Lee', email: 'morgan.l@email.com', phone: '+1 555-0205', types: ['lead'], source: 'facebook', status: 'contacted', score: 65, tags: ['cold_lead'], metadata: { notes: 'Inquired about Downtown Loft. Responded once then went quiet.' } },
      { firstName: 'Riley', lastName: 'Martinez', email: 'riley.m@email.com', phone: '+1 555-0207', types: ['lead'], source: 'craigslist', status: 'new', score: 55, tags: ['budget_conscious'], metadata: { notes: 'Budget seems low for the area.' } },
      { firstName: 'Quinn', lastName: 'Davis', email: 'quinn.d@email.com', phone: '+1 555-0209', types: ['lead'], source: 'turbotenant', status: 'qualified', score: 89, tags: ['corporate', 'hot_lead', 'urgent'], metadata: { notes: 'Corporate relocation from Seattle, company paying.' } },
      { firstName: 'Skyler', lastName: 'Johnson', email: 'skyler.j@email.com', phone: '+1 555-0210', types: ['lead'], source: 'zillow', status: 'new', score: 70, tags: [], metadata: { notes: 'First inquiry, needs to schedule showing.' } },
      { firstName: 'Reese', lastName: 'Wilson', email: 'reese.w@email.com', phone: '+1 555-0215', types: ['lead'], source: 'direct', status: 'contacted', score: 72, tags: ['referral'], metadata: { notes: 'Referred by current tenant Casey Williams.' } },
      { firstName: 'Blake', lastName: 'Miller', email: 'blake.m@email.com', phone: '+1 555-0216', types: ['lead'], source: 'airbnb', status: 'qualified', score: 80, tags: ['str_to_mtr'], metadata: { notes: 'Loved STR stay, wants to convert to 3-month MTR.' } },
    ];

    const { data: contacts, error: contactsError } = await supabase.schema('crm').from('contacts').insert(
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

    // Create bookings
    const today = new Date();
    const { error: bookingsError } = await supabase.schema('landlord').from('bookings').insert([
      // STR Bookings for Downtown Loft
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[0].id, booking_type: 'reservation', status: 'active', start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 950, source: 'airbnb', notes: 'Returning guest, 3rd stay' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[1].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'airbnb' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[2].id, booking_type: 'reservation', status: 'pending', start_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 600, source: 'direct' },
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[3].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 1400, source: 'vrbo', notes: 'Week-long vacation' },

      // MTR Booking for Suburban Family Home
      { user_id: userId, property_id: properties[1].id, contact_id: contacts[5].id, booking_type: 'reservation', status: 'active', start_date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3200, rate_type: 'monthly', total_amount: 9600, source: 'furnishedfinder', notes: 'Travel nurse contract, 3 months' },
      { user_id: userId, property_id: properties[1].id, contact_id: contacts[6].id, booking_type: 'reservation', status: 'confirmed', start_date: new Date(today.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 140 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 3200, rate_type: 'monthly', total_amount: 9600, source: 'furnishedfinder', notes: 'Medical resident' },

      // LTR Lease for Cozy Studio
      { user_id: userId, property_id: properties[2].id, contact_id: contacts[4].id, booking_type: 'lease', status: 'active', start_date: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() + 185 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 1100, rate_type: 'monthly', total_amount: 13200, deposit: 1100, deposit_status: 'received', source: 'zillow', notes: 'Annual lease, model tenant' },

      // Completed booking for history
      { user_id: userId, property_id: properties[0].id, contact_id: contacts[0].id, booking_type: 'reservation', status: 'completed', start_date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end_date: new Date(today.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], rate: 175, rate_type: 'nightly', total_amount: 1050, source: 'airbnb', notes: 'Previous stay - excellent guest' },
    ]);
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw new Error(`Failed to create bookings: ${bookingsError.message}`);
    }
    console.log('Created bookings');

    // Create conversations
    const conversationData = [
      { contactIdx: 0, propertyIdx: 0, channel: 'email', status: 'active', is_ai_enabled: true },
      { contactIdx: 1, propertyIdx: 0, channel: 'sms', status: 'active', is_ai_enabled: true },
      { contactIdx: 3, propertyIdx: 0, channel: 'whatsapp', status: 'active', is_ai_enabled: false },
      { contactIdx: 4, propertyIdx: 2, channel: 'email', status: 'active', is_ai_enabled: false },
      { contactIdx: 5, propertyIdx: 1, channel: 'sms', status: 'active', is_ai_enabled: true },
      { contactIdx: 9, propertyIdx: 1, channel: 'email', status: 'active', is_ai_enabled: true },
      { contactIdx: 10, propertyIdx: 0, channel: 'email', status: 'active', is_ai_enabled: true },
      { contactIdx: 11, propertyIdx: 2, channel: 'sms', status: 'active', is_ai_enabled: true },
      { contactIdx: 12, propertyIdx: 1, channel: 'email', status: 'active', is_ai_enabled: true },
      { contactIdx: 13, propertyIdx: 0, channel: 'whatsapp', status: 'active', is_ai_enabled: true },
    ];

    const { data: convos, error: convosError } = await supabase.schema('landlord').from('conversations').insert(
      conversationData.map((c, i) => ({
        user_id: userId,
        contact_id: contacts[c.contactIdx].id,
        property_id: properties[c.propertyIdx].id,
        channel: c.channel,
        status: c.status,
        is_ai_enabled: c.is_ai_enabled,
        message_count: 3 + i,
        last_message_at: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
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
    const messageTemplates = [
      [
        { direction: 'inbound', content: 'Hi! I\'m so excited for my stay next week. Quick question - what\'s the wifi password?', sent_by: 'contact' },
        { direction: 'outbound', content: 'We\'re excited to host you! The wifi password will be in the welcome book on the kitchen counter. Network is "DowntownLoft" and password is "Welcome2024".', sent_by: 'ai', ai_confidence: 95 },
        { direction: 'inbound', content: 'Perfect, thank you! Is early check-in possible?', sent_by: 'contact' },
      ],
      [
        { direction: 'inbound', content: 'Hey can I get late checkout?', sent_by: 'contact' },
        { direction: 'outbound', content: 'I can do 1pm checkout for a $50 fee. Does that work?', sent_by: 'ai', ai_confidence: 88 },
        { direction: 'inbound', content: 'Yes that\'s great thanks!', sent_by: 'contact' },
      ],
      [
        { direction: 'inbound', content: 'Is the hot tub working?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Yes, it\'s ready for you! Just let me know if you need help with the controls.', sent_by: 'user' },
      ],
      [
        { direction: 'inbound', content: 'Hey, the garbage disposal is making a weird noise again. Not urgent but wanted to let you know.', sent_by: 'contact' },
        { direction: 'outbound', content: 'Thanks for letting me know Casey! I\'ll schedule the plumber to take a look. Does Tuesday between 10-12 work for access?', sent_by: 'user' },
        { direction: 'inbound', content: 'Tuesday works. I WFH so I\'ll be here.', sent_by: 'contact' },
      ],
      [
        { direction: 'inbound', content: 'Just wanted to confirm my lease extension went through?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Yes Drew, you\'re all set for another 3 months! Same rate. I\'ll send the updated agreement today.', sent_by: 'user' },
        { direction: 'inbound', content: 'Awesome, love the place. Thanks!', sent_by: 'contact' },
      ],
      [
        { direction: 'inbound', content: 'Hi, I saw your listing on FurnishedFinder. Is the Suburban Family Home still available for Feb 1?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Taylor! Yes, it\'s available starting Feb 1. It\'s a 4BR/3BA home perfect for travel nurses. Monthly rate is $3,200 all utilities included. Would you like to schedule a showing?', sent_by: 'ai', ai_confidence: 94 },
        { direction: 'inbound', content: 'That sounds perfect! I\'m a travel nurse starting at Dell Seton. Can I see it this weekend?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Saturday at 2pm works great. I\'ll send you the address and confirmation. Looking forward to meeting you!', sent_by: 'user' },
      ],
      [
        { direction: 'inbound', content: 'How much is the downtown loft?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Morgan! The Downtown Loft is $175/night for short stays or $4,500/month for stays 30+ days. Which timeframe were you thinking?', sent_by: 'ai', ai_confidence: 91 },
      ],
      [
        { direction: 'inbound', content: 'do u have anything under $800/mo?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi! Our most affordable option is the Cozy Studio at $1,100/month. It\'s a great deal for the downtown location with utilities included. Would you like more details?', sent_by: 'ai', ai_confidence: 85 },
      ],
      [
        { direction: 'inbound', content: 'Hello, I\'m relocating to Austin for work and my company will be handling payment. I need housing starting next week ideally. Do you have anything for 3-6 months?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Quinn! Welcome to Austin. I have the Suburban Family Home available - it\'s perfect for corporate relocations. 4BR/3BA, $3,200/month, fully furnished. We accept corporate payments and can do a quick move-in. When can you tour?', sent_by: 'ai', ai_confidence: 96 },
        { direction: 'inbound', content: 'Can we do a video tour today? I\'m still in Seattle but need to lock something down.', sent_by: 'contact' },
      ],
      [
        { direction: 'inbound', content: 'Hi, interested in the downtown loft. Is it still available?', sent_by: 'contact' },
        { direction: 'outbound', content: 'Hi Skyler! Yes, the Downtown Loft is available. It\'s a modern 1BR/1BA at $175/night or $4,500/month. Would you like to schedule a tour?', sent_by: 'ai', ai_confidence: 92 },
      ],
    ];

    for (let i = 0; i < convos.length; i++) {
      const messages = messageTemplates[i] || messageTemplates[0];
      const { error: msgError } = await supabase.schema('landlord').from('messages').insert(
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

    // Add pending AI responses
    const { error: aiQueueError } = await supabase.schema('landlord').from('ai_queue_items').insert([
      { user_id: userId, conversation_id: convos[0].id, suggested_response: 'I can offer early check-in at 1pm for a $25 fee, or complimentary at 2pm if the previous guest checks out on time. Which would you prefer?', confidence: 92, reasoning: 'Guest requested early check-in', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { user_id: userId, conversation_id: convos[5].id, suggested_response: 'Perfect! I\'ll see you Saturday at 2pm at 789 Oak Lane. I\'ll send you a calendar invite and directions. Please bring a valid ID for the application if you decide to move forward!', confidence: 96, reasoning: 'Lead confirmed showing time', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { user_id: userId, conversation_id: convos[6].id, suggested_response: 'Hi Morgan! Just checking in - were you still interested in the Downtown Loft? I have some availability coming up and wanted to give you first dibs. Let me know if you\'d like to schedule a tour!', confidence: 78, reasoning: 'Lead went quiet, time for follow-up', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
      { user_id: userId, conversation_id: convos[8].id, suggested_response: 'Absolutely! I can do a FaceTime or Zoom tour at 3pm CST today. I\'ll walk you through every room. If you like it, we can do the application and lease signing digitally. What video platform works best for you?', confidence: 95, reasoning: 'Corporate lead wants video tour', status: 'pending', expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() },
      { user_id: userId, conversation_id: convos[9].id, suggested_response: 'Great! How about Saturday at 11am or Sunday at 2pm? The loft is in a great location downtown, walking distance to 6th Street and the Capitol. I think you\'ll love it!', confidence: 91, reasoning: 'Lead interested, needs showing scheduled', status: 'pending', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
    ]);
    if (aiQueueError) {
      console.error('Error creating AI queue entries:', aiQueueError);
      throw new Error(`Failed to create AI queue entries: ${aiQueueError.message}`);
    }
    console.log('Created AI queue entries');
  },
};
