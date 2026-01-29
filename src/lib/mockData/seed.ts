// src/lib/mockData/seed.ts
// Initial seed data for mock mode

import { MockDataStore } from './queryBuilder';
import {
  createMockLead,
  createMockProfile,
  createMockProperty,
  createMockContact,
  createMockMessage,
  createMockComp,
  createMockUserPlan,
  createMockDeal,
  createMockDealEvent,
} from './factories';

// Dev user ID - used for consistent mock auth
export const DEV_USER_ID = 'dev-user-00000000-0000-0000-0000-000000000001';
export const DEV_USER_EMAIL = 'dev@doughy.ai';

/**
 * Seed the mock data store with initial data
 */
export function seedMockData(store: MockDataStore): void {
  // Create dev user profile
  const devProfile = createMockProfile({
    id: DEV_USER_ID,
    email: DEV_USER_EMAIL,
    role: 'admin',
  });
  store.insert('user_profiles', devProfile);

  // Create user plan for dev user
  const devUserPlan = createMockUserPlan({
    user_id: DEV_USER_ID,
    tier: 'professional',
    status: 'active',
    monthly_token_cap: 100000,
  });
  store.insert('user_plans', devUserPlan);

  // Create sample leads
  const leads = [
    createMockLead({
      name: 'John Smith',
      email: 'john.smith@example.com',
      company: 'Smith Properties LLC',
      status: 'active',
      score: 85,
      tags: ['VIP', 'Hot Lead'],
    }),
    createMockLead({
      name: 'Sarah Johnson',
      email: 'sarah.j@realestate.com',
      company: 'Johnson Realty',
      status: 'new',
      score: 72,
      tags: ['Referral'],
    }),
    createMockLead({
      name: 'Mike Davis',
      email: 'mike.davis@investor.com',
      company: 'Davis Investments',
      status: 'won',
      score: 95,
      tags: ['VIP'],
    }),
    createMockLead({
      name: 'Emily Chen',
      email: 'emily.chen@firsttime.com',
      company: null,
      status: 'active',
      score: 60,
      tags: ['Follow-up'],
    }),
    createMockLead({
      name: 'Robert Wilson',
      email: 'rwilson@commercial.com',
      company: 'Wilson Commercial Group',
      status: 'closed',
      score: 45,
      tags: ['Cold'],
    }),
  ];

  for (const lead of leads) {
    store.insert('crm_leads', lead);
  }

  // Create sample properties
  const properties = [
    createMockProperty({
      profile_id: DEV_USER_ID,
      address_line_1: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1850,
      purchase_price: 285000,
      arv: 375000,
      status: 'active',
      tags: ['Flip'],
    }),
    createMockProperty({
      profile_id: DEV_USER_ID,
      address_line_1: '456 Oak Avenue',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      bedrooms: 4,
      bathrooms: 2.5,
      square_feet: 2400,
      purchase_price: 420000,
      arv: 525000,
      status: 'pending',
      tags: ['Rental', 'Buy & Hold'],
    }),
    createMockProperty({
      profile_id: DEV_USER_ID,
      address_line_1: '789 Elm Drive',
      city: 'Houston',
      state: 'TX',
      zip: '77001',
      bedrooms: 2,
      bathrooms: 1,
      square_feet: 1200,
      purchase_price: 150000,
      arv: 220000,
      status: 'active',
      tags: ['Wholesale'],
    }),
  ];

  for (const property of properties) {
    store.insert('investor_properties', property);

    // Create comps for each property
    const comps = Array.from({ length: 3 }, () =>
      createMockComp({
        property_id: property.id,
        city: property.city,
        state: property.state,
      })
    );
    for (const comp of comps) {
      store.insert('investor_comps', comp);
    }
  }

  // Create sample contacts
  const contacts = [
    createMockContact({
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      company: 'Smith Properties LLC',
      job_title: 'Owner',
    }),
    createMockContact({
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.j@realestate.com',
      company: 'Johnson Realty',
      job_title: 'Broker',
    }),
  ];

  for (const contact of contacts) {
    store.insert('crm_contacts', contact);
  }

  // Create sample messages
  const messages = [
    createMockMessage({
      lead_id: leads[0].id,
      channel: 'sms',
      direction: 'outgoing',
      body: 'Hi John, following up on our conversation about the property on Main Street. Are you still interested?',
      status: 'delivered',
    }),
    createMockMessage({
      lead_id: leads[0].id,
      channel: 'sms',
      direction: 'incoming',
      body: 'Yes, I am! Can we schedule a viewing this week?',
      status: 'delivered',
    }),
    createMockMessage({
      lead_id: leads[1].id,
      channel: 'email',
      direction: 'outgoing',
      body: 'Dear Sarah, Thank you for your interest in our investment opportunities...',
      subject: 'Investment Opportunities',
      status: 'delivered',
    }),
  ];

  for (const message of messages) {
    store.insert('comms_messages', message);
  }

  // Create sample deals linking leads and properties
  const deals = [
    createMockDeal({
      user_id: DEV_USER_ID,
      lead_id: leads[0].id,
      property_id: properties[0].id,
      status: 'active',
      stage: 'analyzing',
      title: '123 Main Street Deal',
      next_action: 'Run comps analysis',
      next_action_due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockDeal({
      user_id: DEV_USER_ID,
      lead_id: leads[1].id,
      property_id: properties[1].id,
      status: 'active',
      stage: 'offer_sent',
      title: '456 Oak Avenue Deal',
      next_action: 'Follow up on offer',
      next_action_due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockDeal({
      user_id: DEV_USER_ID,
      lead_id: leads[2].id,
      property_id: properties[2].id,
      status: 'active',
      stage: 'negotiating',
      title: '789 Elm Drive Deal',
      next_action: 'Counter offer discussion',
      next_action_due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockDeal({
      user_id: DEV_USER_ID,
      lead_id: leads[3].id,
      property_id: null,
      status: 'active',
      stage: 'new',
      title: 'New Seller Lead',
      next_action: 'Initial contact call',
      next_action_due: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    createMockDeal({
      user_id: DEV_USER_ID,
      lead_id: null,
      property_id: null,
      status: 'won',
      stage: 'closed_won',
      title: 'Previous Closed Deal',
      next_action: null,
      next_action_due: null,
    }),
  ];

  for (const deal of deals) {
    store.insert('investor_deals_pipeline', deal);

    // Create deal events for each deal (for timeline)
    const dealEvents = [
      createMockDealEvent({
        deal_id: deal.id,
        event_type: 'stage_change',
        title: `Deal created at ${deal.stage} stage`,
        description: 'Initial deal creation',
        source: 'system',
        created_at: deal.created_at || new Date().toISOString(),
      }),
      createMockDealEvent({
        deal_id: deal.id,
        event_type: 'next_action_set',
        title: deal.next_action || 'Follow up with seller',
        source: 'system',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      createMockDealEvent({
        deal_id: deal.id,
        event_type: 'note',
        title: 'Note added',
        description: 'Initial notes about this deal. Seller seems motivated.',
        source: 'user',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    for (const event of dealEvents) {
      store.insert('investor_deal_events', event);
    }
  }

  console.log('[MOCK] Seeded mock data store:', {
    profiles: store.getAll('user_profiles').length,
    user_plans: store.getAll('user_plans').length,
    leads: store.getAll('crm_leads').length,
    investor_properties: store.getAll('investor_properties').length,
    investor_comps: store.getAll('investor_comps').length,
    contacts: store.getAll('crm_contacts').length,
    comms_messages: store.getAll('comms_messages').length,
    investor_deals_pipeline: store.getAll('investor_deals_pipeline').length,
    investor_deal_events: store.getAll('investor_deal_events').length,
  });
}
