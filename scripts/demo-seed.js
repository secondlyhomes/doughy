#!/usr/bin/env node
/**
 * Demo Seed Script
 *
 * Seeds the staging Supabase database with realistic demo data for the
 * Feb 20 client demo. All records are tracked in public.demo_seed_log
 * so they can be cleanly deleted without touching real data.
 *
 * Usage:
 *   node scripts/demo-seed.js create   — insert all demo data
 *   node scripts/demo-seed.js reset    — delete then re-insert
 *   node scripts/demo-seed.js delete   — remove only seeded records
 *   node scripts/demo-seed.js verify   — check everything is ready
 *
 * Requirements:
 *   - EXPO_PUBLIC_SUPABASE_URL in .env
 *   - SUPABASE_SECRET_KEY in .env (new format: sb_secret_...)
 *     Falls back to SUPABASE_SERVICE_ROLE_KEY (legacy JWT format)
 *   - DB function public.seed_toggle_triggers() must exist (migration)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// ─── Load .env from project root ───────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Prefer new secret key format, fall back to legacy service_role JWT
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing env vars. Add to .env:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('  SUPABASE_SECRET_KEY=sb_secret_...');
  console.error('Get your secret key from: https://supabase.com/dashboard/project/lqmbyobweeaigrwmvizo/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
});

// ─── Constants ─────────────────────────────────────────────────────────────
const USER_ID = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';
const WORKSPACE_ID = '90886395-a5ba-48c1-b72b-8cdfa07d3854';
const SEED_BATCH = 'demo-feb20';
const USER_PHONE = '+17574723676';

// Deterministic UUIDs for cross-referencing (always the same on every run)
const IDS = {
  // Leads (crm.leads)
  marcusThompson: 'a1b2c3d4-0001-4000-8000-000000000001',
  lindaChen: 'a1b2c3d4-0002-4000-8000-000000000002',
  robertDavis: 'a1b2c3d4-0003-4000-8000-000000000003',
  // Contacts (crm.contacts)
  sarahMartinez: 'a1b2c3d4-0004-4000-8000-000000000004',
  mikeJohnson: 'a1b2c3d4-0005-4000-8000-000000000005',
  jamesWilson: 'a1b2c3d4-0006-4000-8000-000000000006',
  // Properties
  mapleDriveProperty: 'a1b2c3d4-0007-4000-8000-000000000007',
  oakAveProperty: 'a1b2c3d4-0008-4000-8000-000000000008',
  elmStProperty: 'a1b2c3d4-0009-4000-8000-000000000009',
  // Deal
  marcusDeal: 'a1b2c3d4-0010-4000-8000-000000000010',
  // Call + summary
  marcusCall: 'a1b2c3d4-0011-4000-8000-000000000011',
  marcusCallSummary: 'a1b2c3d4-0012-4000-8000-000000000012',
  // Vendor
  mikeJohnsonVendor: 'a1b2c3d4-0015-4000-8000-000000000001',
  // Email rules
  ruleFurnishedFinder: 'a1b2c3d4-0020-4000-8000-000000000001',
  ruleAirbnb: 'a1b2c3d4-0020-4000-8000-000000000002',
  ruleVrbo: 'a1b2c3d4-0020-4000-8000-000000000003',
  ruleTurboTenant: 'a1b2c3d4-0020-4000-8000-000000000004',
  ruleZillow: 'a1b2c3d4-0020-4000-8000-000000000005',
  ruleRealtor: 'a1b2c3d4-0020-4000-8000-000000000006',
  // CallPilot profile
  callpilotProfile: 'a1b2c3d4-0021-4000-8000-000000000001',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Toggle user-defined triggers on a table (disable before insert, enable after) */
async function toggleTriggers(schema, table, enable) {
  const { error } = await supabase.rpc('seed_toggle_triggers', {
    p_schema: schema,
    p_table: table,
    p_enable: enable,
  });
  if (error) {
    console.error(`  ✗ ${enable ? 'Enable' : 'Disable'} triggers on ${schema}.${table}: ${error.message}`);
    return false;
  }
  return true;
}

/** Insert into a schema table via REST and track in demo_seed_log */
async function seedInsert(schema, table, records, opts = {}) {
  const { disableTriggers = false } = opts;
  const inserted = [];

  // Disable triggers if requested (workspace triggers block service-role inserts)
  if (disableTriggers) {
    const ok = await toggleTriggers(schema, table, false);
    if (!ok) {
      console.error(`  ✗ Skipping ${schema}.${table} — could not disable triggers`);
      return inserted;
    }
  }

  try {
    for (const record of records) {
      const id = record.id;
      if (!id) {
        console.error(`  ✗ ${schema}.${table}: record missing id`);
        continue;
      }

      const client = schema === 'public' ? supabase : supabase.schema(schema);
      const { data, error } = await client.from(table).insert(record).select('id').single();

      if (error) {
        // If it already exists, skip gracefully
        if (error.code === '23505') {
          console.log(`  ~ ${schema}.${table}: ${id} already exists (skipping)`);
          inserted.push(id);
          continue;
        }
        console.error(`  ✗ ${schema}.${table} [${id}]: ${error.message}`);
        continue;
      }

      // Track in demo_seed_log
      await supabase.from('demo_seed_log').insert({
        target_schema: schema,
        target_table: table,
        record_id: data.id,
        seed_batch: SEED_BATCH,
      });

      inserted.push(data.id);
    }
    console.log(`  ✓ ${schema}.${table}: ${inserted.length}/${records.length} inserted`);
  } finally {
    // Always re-enable triggers
    if (disableTriggers) {
      await toggleTriggers(schema, table, true);
    }
  }

  return inserted;
}

/** Delete all records from a previous seed batch */
async function seedDelete() {
  // Get all tracked records
  const { data: logs, error } = await supabase
    .from('demo_seed_log')
    .select('*')
    .eq('seed_batch', SEED_BATCH)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to read demo_seed_log:', error.message);
    return false;
  }

  if (!logs || logs.length === 0) {
    console.log('No demo seed records found to delete.');
    return true;
  }

  console.log(`Found ${logs.length} seeded records to delete...`);

  // Group by schema.table for batch deletes
  const groups = {};
  for (const log of logs) {
    const key = `${log.target_schema}.${log.target_table}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log.record_id);
  }

  // Delete in reverse dependency order (children before parents)
  const deleteOrder = [
    // CallPilot (deepest children first)
    'callpilot.suggested_updates',
    'callpilot.action_items',
    'callpilot.call_summaries',
    'callpilot.transcript_chunks',
    'callpilot.calls',
    'callpilot.user_profiles',
    // Claw
    'claw.email_rules',
    'claw.cost_log',
    'claw.connections',
    // Investor (deal refs property + lead, images ref property)
    'investor.deals_pipeline',
    'investor.property_images',
    'investor.properties',
    // Landlord
    'landlord.vendors',
    'landlord.properties',
    // CRM (leads + contacts are leaf-ish)
    'crm.leads',
    'crm.contacts',
  ];

  // Tables with workspace triggers need trigger bypass for deletes too (just in case)
  const triggerTables = [
    'investor.properties',
    'investor.property_images',
    'investor.deals_pipeline',
    'landlord.properties',
    'landlord.vendors',
  ];

  for (const key of deleteOrder) {
    if (!groups[key]) continue;
    const [schema, table] = key.split('.');
    const ids = groups[key];

    // Disable triggers if needed
    if (triggerTables.includes(key)) {
      await toggleTriggers(schema, table, false);
    }

    const client = schema === 'public' ? supabase : supabase.schema(schema);
    const { error: delError } = await client.from(table).delete().in('id', ids);

    // Re-enable triggers
    if (triggerTables.includes(key)) {
      await toggleTriggers(schema, table, true);
    }

    if (delError) {
      console.error(`  ✗ ${key}: ${delError.message}`);
    } else {
      console.log(`  ✓ ${key}: ${ids.length} deleted`);
    }
  }

  // Also handle any remaining groups not in the explicit order
  for (const key of Object.keys(groups)) {
    if (deleteOrder.includes(key)) continue;
    const [schema, table] = key.split('.');
    const ids = groups[key];
    const client = schema === 'public' ? supabase : supabase.schema(schema);
    const { error: delError } = await client.from(table).delete().in('id', ids);
    if (delError) {
      console.error(`  ✗ ${key}: ${delError.message}`);
    } else {
      console.log(`  ✓ ${key}: ${ids.length} deleted`);
    }
  }

  // Clean up the tracking table
  const { error: cleanupError } = await supabase
    .from('demo_seed_log')
    .delete()
    .eq('seed_batch', SEED_BATCH);

  if (cleanupError) {
    console.error('Failed to clean demo_seed_log:', cleanupError.message);
  } else {
    console.log('  ✓ demo_seed_log cleaned');
  }

  return true;
}

// ─── Seed Data Functions ───────────────────────────────────────────────────

async function seedLeads() {
  console.log('\nSeeding investor leads...');

  await seedInsert('crm', 'leads', [
    {
      id: IDS.marcusThompson,
      user_id: USER_ID,
      name: 'Marcus Thompson',
      phone: USER_PHONE,
      email: 'marcus.t@email.com',
      module: 'investor',
      status: 'active',
      source: 'direct_mail',
      score: 92,
      tags: ['hot', 'creative_finance', 'inherited'],
      address_line_1: '8234 Maple Drive',
      city: 'Fairfax',
      state: 'VA',
      zip: '22030',
      notes: 'Inherited property from grandmother. Lives in Texas. Property vacant 8 months. Behind on taxes 2 years. Motivated — wants to sell within 60 days. Open to creative finance. Roof needs full replacement, HVAC is 20 years old (original 1998). ARV estimated $320k. Asking ~$180k but flexible. Sister also on deed (lives in Florida, on board with sale).',
      review_status: 'reviewed',
      is_conversation_started: true,
    },
    {
      id: IDS.lindaChen,
      user_id: USER_ID,
      name: 'Linda Chen',
      phone: '+15715559876',
      module: 'investor',
      status: 'active',
      source: 'cold_call',
      score: 68,
      tags: ['warm', 'tired_landlord', 'free_and_clear'],
      address_line_1: '1547 Oak Street',
      city: 'Arlington',
      state: 'VA',
      zip: '22201',
      notes: 'Tired landlord. Owns duplex free and clear. Considering selling but not in a rush. Needs to talk to husband. Follow up in 2 weeks.',
      review_status: 'reviewed',
    },
    {
      id: IDS.robertDavis,
      user_id: USER_ID,
      name: 'Robert Davis',
      phone: '+17035557777',
      module: 'investor',
      status: 'active',
      source: 'other',
      score: 25,
      tags: ['cold', 'absentee', 'skip_trace'],
      address_line_1: '920 Pine Lane',
      city: 'Centreville',
      state: 'VA',
      zip: '20120',
      notes: 'Absentee owner. No answer x3. Left voicemail twice.',
      review_status: 'reviewed',
    },
  ]);
}

async function seedContacts() {
  console.log('\nSeeding landlord contacts...');

  await seedInsert('crm', 'contacts', [
    {
      id: IDS.sarahMartinez,
      user_id: USER_ID,
      first_name: 'Sarah',
      last_name: 'Martinez',
      phone: '+15715558888',
      email: 'sarah.m@email.com',
      module: 'landlord',
      contact_types: ['tenant'],
      status: 'active',
      notes: 'Unit 3, 456 Oak Ave. Lease through Feb 2027. Medium-term rental. Quiet, pays on time.',
      tags: ['tenant', 'good_standing'],
    },
    {
      id: IDS.mikeJohnson,
      user_id: USER_ID,
      first_name: 'Mike',
      last_name: 'Johnson',
      phone: USER_PHONE,
      email: 'mike@mikesplumbing.com',
      company: "Mike's Plumbing",
      module: 'landlord',
      contact_types: ['vendor'],
      status: 'active',
      notes: 'Reliable plumber. Usually responds within 2 hours. Has done 8 jobs for us. Average cost $340. Rate: $85/hour.',
      tags: ['vendor', 'plumbing', 'preferred'],
      metadata: { specialty: 'plumbing', hourly_rate: 85 },
    },
    {
      id: IDS.jamesWilson,
      user_id: USER_ID,
      first_name: 'James',
      last_name: 'Wilson',
      email: 'j.wilson@email.com',
      module: 'landlord',
      contact_types: ['guest'],
      status: 'new',
      source: 'furnishedfinder',
      notes: 'Furnished Finder inquiry. Travel nurse. Looking for 3-month stay starting March 1. Budget $1800/mo.',
      tags: ['guest', 'travel_nurse', 'inquiry'],
    },
  ]);
}

async function seedInvestorProperty() {
  console.log('\nSeeding investor property (Maple Drive)...');

  // investor.properties has workspace triggers that use auth.uid() — must disable
  await seedInsert(
    'investor',
    'properties',
    [
      {
        id: IDS.mapleDriveProperty,
        user_id: USER_ID,
        workspace_id: WORKSPACE_ID,
        address_line_1: '8234 Maple Drive',
        city: 'Fairfax',
        state: 'VA',
        zip: '22030',
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 1850,
        year_built: 1998,
        purchase_price: 175000,
        arv: 320000,
        status: 'under_contract', // enum: prospect|active|under_contract|closed|dead
        property_type: 'single_family',
        is_vacant: true,
        is_owner_occupied: false,
        lead_id: IDS.marcusThompson,
        notes:
          'Inherited by Marcus Thompson. Vacant 8 months. Roof needs full replacement. HVAC original from 1998. Behind on taxes 2 years. Subject-to existing mortgage ($95k at 3.5%).',
        primary_image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        tags: ['inherited', 'vacant', 'needs_repairs', 'creative_finance'],
        mortgage_info: {
          existing_balance: 95000,
          interest_rate: 3.5,
          type: 'subject_to',
          seller_finance_amount: 80000,
          seller_finance_rate: 5.0,
          seller_finance_term_years: 15,
        },
      },
    ],
    { disableTriggers: true }
  );
}

async function seedPropertyImages() {
  console.log('\nSeeding property images (Maple Drive gallery)...');

  // Stable Unsplash photo IDs for a residential property
  await seedInsert(
    'investor',
    'property_images',
    [
      {
        id: 'a1b2c3d4-0070-4000-8000-000000000001',
        property_id: IDS.mapleDriveProperty,
        url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
        label: 'Front exterior',
        is_primary: true,
        uploaded_by: USER_ID,
        workspace_id: WORKSPACE_ID,
      },
      {
        id: 'a1b2c3d4-0070-4000-8000-000000000002',
        property_id: IDS.mapleDriveProperty,
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        label: 'Side view',
        is_primary: false,
        uploaded_by: USER_ID,
        workspace_id: WORKSPACE_ID,
      },
      {
        id: 'a1b2c3d4-0070-4000-8000-000000000003',
        property_id: IDS.mapleDriveProperty,
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        label: 'Living room',
        is_primary: false,
        uploaded_by: USER_ID,
        workspace_id: WORKSPACE_ID,
      },
      {
        id: 'a1b2c3d4-0070-4000-8000-000000000004',
        property_id: IDS.mapleDriveProperty,
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        label: 'Kitchen',
        is_primary: false,
        uploaded_by: USER_ID,
        workspace_id: WORKSPACE_ID,
      },
      {
        id: 'a1b2c3d4-0070-4000-8000-000000000005',
        property_id: IDS.mapleDriveProperty,
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        label: 'Backyard',
        is_primary: false,
        uploaded_by: USER_ID,
        workspace_id: WORKSPACE_ID,
      },
    ],
    { disableTriggers: true }
  );
}

async function seedLandlordProperties() {
  console.log('\nSeeding landlord properties...');

  // landlord.properties has workspace triggers — must disable
  await seedInsert(
    'landlord',
    'properties',
    [
      {
        id: IDS.oakAveProperty,
        user_id: USER_ID,
        workspace_id: WORKSPACE_ID,
        name: '456 Oak Ave',
        address: '456 Oak Ave',
        city: 'Falls Church',
        state: 'VA',
        zip: '22046',
        property_type: 'multi_family',
        rental_type: 'mtr',
        bedrooms: 4,
        bathrooms: 4,
        square_feet: 3200,
        base_rate: 1700,
        rate_type: 'monthly',
        status: 'active',
        primary_image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        description: '4-unit multi-family. 3 occupied, 1 being turned. Medium-term furnished rentals.',
        internal_notes: '4 units. 75% occupancy. Monthly revenue $6,800. Unit 4 turnover in progress.',
      },
      {
        id: IDS.elmStProperty,
        user_id: USER_ID,
        workspace_id: WORKSPACE_ID,
        name: '789 Elm St',
        address: '789 Elm St',
        city: 'Fairfax',
        state: 'VA',
        zip: '22030',
        property_type: 'single_family',
        rental_type: 'mtr',
        bedrooms: 3,
        bathrooms: 2,
        square_feet: 1800,
        base_rate: 1700,
        rate_type: 'monthly',
        is_room_by_room_enabled: true,
        status: 'active',
        primary_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        description: '3-bed SFH. Room-by-room rental. Fully occupied.',
        internal_notes: '3 rooms rented individually. 100% occupancy. Monthly revenue $5,100.',
      },
    ],
    { disableTriggers: true }
  );
}

async function seedDeal() {
  console.log('\nSeeding deal for Marcus Thompson...');

  // investor.deals_pipeline has workspace triggers — must disable
  await seedInsert(
    'investor',
    'deals_pipeline',
    [
      {
        id: IDS.marcusDeal,
        user_id: USER_ID,
        workspace_id: WORKSPACE_ID,
        lead_id: IDS.marcusThompson,
        property_id: IDS.mapleDriveProperty,
        status: 'active',
        stage: 'due_diligence',
        title: 'Marcus Thompson — 8234 Maple Drive (Subject-To)',
        estimated_value: 175000,
        probability: 75,
        expected_close_date: '2026-03-15',
        next_action: 'Schedule inspection walkthrough',
        next_action_due: new Date(Date.now() + 3 * 86400000).toISOString(),
        notes:
          'Offer accepted at $175k. Creative finance: subject-to existing mortgage ($95k at 3.5%) + $80k seller finance at 5% over 15 years. Repair estimate $35k (roof + HVAC). ARV $320k. Inspection scheduled this week. Sister on deed — lives in FL, on board. Need to confirm she can sign remotely or get POA.',
      },
    ],
    { disableTriggers: true }
  );
}

async function seedVendor() {
  console.log('\nSeeding landlord vendor (Mike Johnson)...');

  // landlord.vendors has workspace_id column — disable triggers
  await seedInsert(
    'landlord',
    'vendors',
    [
      {
        id: IDS.mikeJohnsonVendor,
        user_id: USER_ID,
        workspace_id: WORKSPACE_ID,
        property_id: IDS.oakAveProperty,
        category: 'plumber', // enum: plumber|electrician|hvac|cleaner|handyman|locksmith|pest_control|landscaper|appliance_repair|pool_service|other
        name: 'Mike Johnson',
        company_name: 'Johnson Plumbing LLC',
        phone: USER_PHONE,
        email: 'mike@mikesplumbing.com',
        is_primary: true,
        preferred_contact_method: 'phone',
        availability_notes: 'Usually responds within 2 hours. Available weekdays 7am-6pm.',
        hourly_rate: 85,
        service_fee: 75,
        rating: 5,
        total_jobs: 8,
        is_active: true,
        notes: 'Preferred plumber. Fast response, fair prices. Has done 8 jobs for us. Average cost $340.',
      },
    ],
    { disableTriggers: true }
  );
}

async function seedConnections() {
  console.log('\nSeeding Claw connections...');

  await seedInsert('claw', 'connections', [
    { id: 'a1b2c3d4-0020-4000-8000-000000000001', user_id: USER_ID, channel: 'doughy', status: 'connected', label: 'CRM \u00b7 synced' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000002', user_id: USER_ID, channel: 'whatsapp', status: 'connected', label: 'Active' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000003', user_id: USER_ID, channel: 'discord', status: 'connected', label: '#claw-channel' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000004', user_id: USER_ID, channel: 'bland', status: 'connected', label: '0 calls today' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000005', user_id: USER_ID, channel: 'sms', status: 'warning', label: 'Active \u00b7 costs $ vs WhatsApp' },
    {
      id: 'a1b2c3d4-0020-4000-8000-000000000006',
      user_id: USER_ID,
      channel: 'gmail',
      status: 'connected',
      label: 'admin@doughy.app \u00b7 reading inbox',
      config: { read_inbox: true, draft_replies: true, send_replies: false, auto_scan_interval: '5min' },
    },
    { id: 'a1b2c3d4-0020-4000-8000-000000000007', user_id: USER_ID, channel: 'slack', status: 'disconnected', label: null },
    { id: 'a1b2c3d4-0020-4000-8000-000000000008', user_id: USER_ID, channel: 'hubspot', status: 'disconnected', label: null },
  ]);
}

async function seedTrustConfig() {
  console.log('\nUpdating trust config...');

  const client = supabase.schema('claw');
  const { error } = await client
    .from('trust_config')
    .update({
      action_overrides: {
        send_followup: 'guarded',
        send_first_outreach: 'manual',
        voicemail_drop: 'autonomous',
        update_lead_temp: 'autonomous',
        bland_cold_reengage: 'guarded',
        dispatch_vendor: 'manual',
      },
    })
    .eq('user_id', USER_ID);

  if (error) {
    console.error(`  ✗ trust_config update: ${error.message}`);
  } else {
    console.log('  ✓ claw.trust_config: action_overrides updated');
  }
}

async function seedCostLog() {
  console.log('\nSeeding cost log (activity feed)...');
  const now = Date.now();

  await seedInsert('claw', 'cost_log', [
    {
      id: 'a1b2c3d4-0030-4000-8000-000000000001',
      user_id: USER_ID,
      service: 'anthropic',
      action: 'morning_briefing',
      input_tokens: 2400,
      output_tokens: 850,
      cost_cents: 4,
      metadata: { model: 'claude-sonnet-4-5-20250929', channel: 'sms' },
      created_at: new Date(now - 2 * 3600000).toISOString(),
    },
    {
      id: 'a1b2c3d4-0030-4000-8000-000000000002',
      user_id: USER_ID,
      service: 'bland',
      action: 'cold_call_linda_chen',
      input_tokens: 0,
      output_tokens: 0,
      duration_seconds: 45,
      cost_cents: 45,
      metadata: { lead: 'Linda Chen', result: 'voicemail' },
      created_at: new Date(now - 90 * 60000).toISOString(),
    },
    {
      id: 'a1b2c3d4-0030-4000-8000-000000000003',
      user_id: USER_ID,
      service: 'twilio',
      action: 'follow_up_sms',
      input_tokens: 0,
      output_tokens: 0,
      cost_cents: 1,
      metadata: { lead: 'Robert Davis', channel: 'sms' },
      created_at: new Date(now - 60 * 60000).toISOString(),
    },
    {
      id: 'a1b2c3d4-0030-4000-8000-000000000004',
      user_id: USER_ID,
      service: 'anthropic',
      action: 'draft_generation',
      input_tokens: 1800,
      output_tokens: 320,
      cost_cents: 3,
      metadata: { model: 'claude-haiku-4-5-20251001', lead: 'Marcus Thompson' },
      created_at: new Date(now - 30 * 60000).toISOString(),
    },
    {
      id: 'a1b2c3d4-0030-4000-8000-000000000005',
      user_id: USER_ID,
      service: 'anthropic',
      action: 'intent_classification',
      input_tokens: 600,
      output_tokens: 50,
      cost_cents: 1,
      metadata: { model: 'claude-haiku-4-5-20251001', intent: 'greeting' },
      created_at: new Date(now - 15 * 60000).toISOString(),
    },
  ]);
}

async function seedStagedCallTranscript() {
  console.log('\nSeeding staged call transcript (Marcus Thompson)...');

  const callStarted = new Date(Date.now() - 4 * 3600000);
  const callEnded = new Date(callStarted.getTime() + 12 * 60000);

  // 1. Call record
  await seedInsert('callpilot', 'calls', [
    {
      id: IDS.marcusCall,
      user_id: USER_ID,
      lead_id: IDS.marcusThompson,
      deal_id: IDS.marcusDeal,
      direction: 'outbound',
      phone_number: USER_PHONE,
      status: 'completed',
      started_at: callStarted.toISOString(),
      ended_at: callEnded.toISOString(),
      duration_seconds: 720,
      transcription_status: 'completed',
      transcript_chunk_count: 24,
      caller_type: 'investor',
      metadata: { demo: true },
    },
  ]);

  // 2. Transcript chunks
  const chunks = buildTranscriptChunks(IDS.marcusCall, callStarted);
  await seedInsert('callpilot', 'transcript_chunks', chunks);

  // 3. Call summary
  await seedInsert('callpilot', 'call_summaries', [
    {
      id: IDS.marcusCallSummary,
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      summary:
        "Productive 12-minute call with Marcus Thompson about the inherited property at 8234 Maple Drive, Fairfax VA. Marcus confirmed the property was inherited from his grandmother and has been vacant for 8 months. He lives in Texas and wants to sell within 60 days. The property needs a full roof replacement and the HVAC is original from 1998. Marcus is open to creative financing \u2014 specifically subject-to the existing mortgage ($95k at 3.5%) with additional seller financing. His sister is also on the deed but lives in Florida and is on board with the sale. Marcus mentioned he's 2 years behind on property taxes. He's hoping for around $180k but is flexible. Next steps: schedule an in-person inspection walkthrough this week, get 2+ roof replacement quotes, and draft a subject-to offer at $175k.",
      sentiment: 'positive',
      key_points: [
        'Inherited from grandmother, vacant 8 months',
        'Lives in Texas, motivated to sell within 60 days',
        'Open to creative finance (subject-to + seller finance)',
        'Roof needs full replacement, HVAC from 1998',
        'Sister on deed (FL), on board with sale',
        '2 years behind on property taxes',
        'Asking ~$180k but flexible',
      ],
      lead_temperature: 'hot',
      closing_recommendation:
        'Strong buy signal. Marcus is motivated by the tax burden and distance from the property. A subject-to offer at $175k with seller finance for the gap should close. Move quickly \u2014 schedule inspection this week and get the offer in writing.',
      unanswered_questions: [
        'Exact property tax arrears amount',
        'Can sister sign remotely or need POA?',
        'Any liens besides mortgage and taxes?',
        'Condition of foundation and electrical?',
      ],
    },
  ]);

  // 4. Action items (pending approval)
  await seedInsert('callpilot', 'action_items', [
    {
      id: 'a1b2c3d4-0040-4000-8000-000000000001',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      description: 'Schedule inspection walkthrough this week',
      category: 'follow_up',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      metadata: { priority: 'high' },
    },
    {
      id: 'a1b2c3d4-0040-4000-8000-000000000002',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      description: 'Get roof replacement quotes (at least 2 contractors)',
      category: 'research',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      metadata: { priority: 'high' },
    },
    {
      id: 'a1b2c3d4-0040-4000-8000-000000000003',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      description: 'Draft subject-to offer at $175k with seller finance terms',
      category: 'document',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      metadata: { priority: 'high' },
    },
    {
      id: 'a1b2c3d4-0040-4000-8000-000000000004',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      description: 'Confirm sister can sign remotely or arrange POA',
      category: 'follow_up',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      metadata: { priority: 'medium' },
    },
    {
      id: 'a1b2c3d4-0040-4000-8000-000000000005',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      description: 'Send comp analysis to Marcus via email',
      category: 'follow_up',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      metadata: { priority: 'medium' },
    },
  ]);

  // 5. Suggested CRM updates (pending approval)
  await seedInsert('callpilot', 'suggested_updates', [
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000001',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'crm.leads',
      target_record_id: IDS.marcusThompson,
      field_name: 'tags',
      current_value: 'hot, creative_finance, inherited',
      suggested_value: 'hot, creative_finance, inherited, motivated_seller, tax_delinquent',
      confidence: 'high',
      source_quote: "I really want to get this done in the next 60 days... the taxes are killing me",
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000002',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'crm.leads',
      target_record_id: IDS.marcusThompson,
      field_name: 'notes',
      current_value: null,
      suggested_value:
        'Timeline: 60 days. Asking $180k flexible. Behind on taxes 2 years. Sister on deed (FL, on board). Open to subject-to + seller finance.',
      confidence: 'high',
      source_quote: null,
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000003',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'investor.properties',
      target_record_id: IDS.mapleDriveProperty,
      field_name: 'notes',
      current_value: null,
      suggested_value: 'Roof: full replacement needed. HVAC: original 1998, end of life. Vacant 8 months. Back taxes: 2 years.',
      confidence: 'high',
      source_quote:
        "The roof definitely needs to be completely replaced... and the heating and cooling, that's the original unit from when the house was built",
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000004',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'investor.properties',
      target_record_id: IDS.mapleDriveProperty,
      field_name: 'purchase_price',
      current_value: '175000',
      suggested_value: '175000',
      confidence: 'high',
      source_quote: "I was thinking around 180, but if we can do something creative with the financing, 175 would work",
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000005',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'investor.deals_pipeline',
      target_record_id: IDS.marcusDeal,
      field_name: 'stage',
      current_value: 'due_diligence',
      suggested_value: 'due_diligence',
      confidence: 'high',
      source_quote: null,
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000006',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'investor.properties',
      target_record_id: IDS.mapleDriveProperty,
      field_name: 'mortgage_info',
      current_value: null,
      suggested_value: JSON.stringify({
        existing_balance: 95000,
        interest_rate: 3.5,
        type: 'subject_to',
        seller_finance_amount: 80000,
        seller_finance_rate: 5.0,
        seller_finance_term_years: 15,
      }),
      confidence: 'high',
      source_quote: "There's still about 95 thousand on the mortgage at three and a half percent",
      status: 'pending',
    },
    {
      id: 'a1b2c3d4-0050-4000-8000-000000000007',
      call_id: IDS.marcusCall,
      user_id: USER_ID,
      target_table: 'crm.leads',
      target_record_id: IDS.marcusThompson,
      field_name: 'score',
      current_value: '92',
      suggested_value: '95',
      confidence: 'medium',
      source_quote: null,
      status: 'pending',
    },
  ]);
}

/** Build 24 realistic transcript chunks for a 12-min call */
function buildTranscriptChunks(callId, callStarted) {
  const startMs = callStarted.getTime();
  const lines = [
    { speaker: 'user', offset: 0, text: "Hey Marcus, this is Dino from Doughy Investments. Thanks for getting back to me on that letter we sent out. How are you doing today?" },
    { speaker: 'contact', offset: 8000, text: "Hey Dino, yeah I got your letter about the house on Maple Drive. I've been meaning to call you back. Doing alright, just busy with work out here in Texas." },
    { speaker: 'user', offset: 18000, text: "I totally understand. So tell me a little bit about the property. The letter mentioned it was on Maple Drive in Fairfax?" },
    { speaker: 'contact', offset: 28000, text: "Yeah, 8234 Maple Drive. It was my grandmother's house. She passed away about a year ago and left it to me and my sister. We've been trying to figure out what to do with it." },
    { speaker: 'user', offset: 42000, text: "I'm sorry to hear about your grandmother. So you and your sister inherited it \u2014 is she local to the area?" },
    { speaker: 'contact', offset: 52000, text: "No, she's down in Florida. Neither of us live near the property. It's been sitting vacant for about 8 months now. We just can't keep up with everything from a distance." },
    { speaker: 'user', offset: 65000, text: "That makes sense. Vacant properties can be a real burden, especially from out of state. What's the current condition like?" },
    { speaker: 'contact', offset: 78000, text: "Honestly, it needs some work. The roof definitely needs to be completely replaced \u2014 we had a storm last year and it took some damage. And the heating and cooling, that's the original unit from when the house was built in '98." },
    { speaker: 'user', offset: 95000, text: "So we're looking at a new roof and a new HVAC system. Those are significant repairs. Are there any other major issues you know of?" },
    { speaker: 'contact', offset: 108000, text: "The bones of the house are good. Foundation is solid, electrical was updated about 10 years ago. It's really just the roof and the HVAC that are the big ticket items." },
    { speaker: 'user', offset: 120000, text: "That's actually good news structurally. Now, you mentioned you've been dealing with this from Texas. Are there any financial pressures on the property right now?" },
    { speaker: 'contact', offset: 135000, text: "Yeah, that's the thing. We're behind on the property taxes \u2014 about two years now. The county has been sending notices. And there's still a mortgage on it, about 95 thousand at three and a half percent." },
    { speaker: 'user', offset: 155000, text: "I appreciate you being upfront about that. The existing mortgage at 3.5% is actually really favorable in today's market. Have you thought about what kind of price range you're looking for?" },
    { speaker: 'contact', offset: 172000, text: "I was thinking around 180, but honestly, if we can do something creative with the financing, 175 would work. I just want to get this resolved. The taxes are killing me and I can't keep maintaining a house 1,500 miles away." },
    { speaker: 'user', offset: 195000, text: "I hear you. What if we structured something where we take over the existing mortgage payments \u2014 that's called a subject-to deal \u2014 and then we work out seller financing for the difference? That way you stop the bleeding on taxes immediately." },
    { speaker: 'contact', offset: 215000, text: "That's interesting. So I wouldn't have to worry about the mortgage payments anymore? And you'd handle the back taxes?" },
    { speaker: 'user', offset: 228000, text: "Exactly. We'd bring the taxes current, take over the mortgage, and give you a note for the remaining equity. You'd get monthly payments on that. It's a win-win." },
    { speaker: 'contact', offset: 245000, text: "I like that. My sister would like that too \u2014 she's been wanting to just be done with it. She said whatever I decide, she's good with it. She can sign whatever we need." },
    { speaker: 'user', offset: 260000, text: "Perfect. Can she sign remotely, or would we need to arrange something special since she's in Florida?" },
    { speaker: 'contact', offset: 275000, text: "She should be able to do it remotely. We did some other paperwork for the estate that way. If not, she said she could give me power of attorney." },
    { speaker: 'user', offset: 290000, text: "Great, that keeps things simple. So here's what I'd like to do next \u2014 I'd love to come see the property this week for a walkthrough inspection. Then I'll get a couple quotes on the roof, and we can put together a formal offer." },
    { speaker: 'contact', offset: 310000, text: "That sounds good. I can give you the lockbox code. I really want to get this done in the next 60 days if possible. The longer it sits, the more it costs me." },
    { speaker: 'user', offset: 330000, text: "Absolutely. I'll also put together a comp analysis showing you what similar properties in the area have sold for recently. I'll email that over to you." },
    { speaker: 'contact', offset: 345000, text: "I'd appreciate that. Thanks Dino, I feel good about this. Let me know when you want to come by the house." },
  ];

  return lines.map((line, i) => ({
    id: `a1b2c3d4-00${String(60 + i).padStart(2, '0')}-4000-8000-000000000001`,
    call_id: callId,
    speaker: line.speaker,
    content: line.text,
    confidence: 0.92 + Math.random() * 0.07,
    timestamp_ms: line.offset,
    duration_ms: i < lines.length - 1 ? lines[i + 1].offset - line.offset : 15000,
  }));
}

// ─── Email Rules ──────────────────────────────────────────────────────────

async function seedEmailRules() {
  console.log('Seeding email rules...');

  const rules = [
    { id: IDS.ruleFurnishedFinder, user_id: USER_ID, rule_name: 'Furnished Finder', sender_patterns: ['@furnishedfinder.com'], subject_keywords: [], target_module: 'landlord', is_active: true },
    { id: IDS.ruleAirbnb, user_id: USER_ID, rule_name: 'Airbnb', sender_patterns: ['@airbnb.com'], subject_keywords: [], target_module: 'landlord', is_active: true },
    { id: IDS.ruleVrbo, user_id: USER_ID, rule_name: 'VRBO', sender_patterns: ['@vrbo.com'], subject_keywords: [], target_module: 'landlord', is_active: true },
    { id: IDS.ruleTurboTenant, user_id: USER_ID, rule_name: 'TurboTenant', sender_patterns: ['@turbotenant.com'], subject_keywords: [], target_module: 'landlord', is_active: true },
    { id: IDS.ruleZillow, user_id: USER_ID, rule_name: 'Zillow', sender_patterns: ['@zillow.com'], subject_keywords: [], target_module: 'investor', is_active: true },
    { id: IDS.ruleRealtor, user_id: USER_ID, rule_name: 'Realtor.com', sender_patterns: ['@realtor.com'], subject_keywords: [], target_module: 'investor', is_active: true },
  ];

  await seedInsert('claw', 'email_rules', rules);
}

// ─── CallPilot User Profile ──────────────────────────────────────────────

async function seedCallPilotProfile() {
  console.log('Seeding CallPilot user profile...');

  await seedInsert('callpilot', 'user_profiles', [{
    id: IDS.callpilotProfile,
    user_id: USER_ID,
    display_name: 'Dino',
    company_name: 'Doughy',
    role: 'investor',
    bio: 'Real estate investor and landlord',
    interests: ['multifamily', 'short-term-rentals', 'fix-and-flip'],
    location: 'Virginia Beach, VA',
    buying_criteria: { min_price: 100000, max_price: 500000, property_types: ['single_family', 'multifamily'] },
    talk_tracks: [],
  }]);
}

// ─── Verify ────────────────────────────────────────────────────────────────

async function verify() {
  console.log('\nVerifying demo readiness...\n');
  let allPassed = true;

  const checks = [
    { schema: 'crm', table: 'leads', min: 3, label: 'Investor leads' },
    { schema: 'crm', table: 'contacts', min: 3, label: 'Landlord contacts' },
    { schema: 'investor', table: 'properties', min: 1, label: 'Investor properties' },
    { schema: 'landlord', table: 'properties', min: 2, label: 'Landlord properties' },
    { schema: 'landlord', table: 'vendors', min: 1, label: 'Landlord vendors' },
    { schema: 'investor', table: 'deals_pipeline', min: 1, label: 'Active deals' },
    { schema: 'claw', table: 'connections', min: 6, label: 'Claw connections' },
    { schema: 'claw', table: 'cost_log', min: 3, label: 'Cost log entries' },
    { schema: 'claw', table: 'trust_config', min: 1, label: 'Trust config' },
    { schema: 'callpilot', table: 'calls', min: 1, label: 'Staged calls' },
    { schema: 'callpilot', table: 'transcript_chunks', min: 20, label: 'Transcript chunks' },
    { schema: 'callpilot', table: 'call_summaries', min: 1, label: 'Call summaries' },
    { schema: 'callpilot', table: 'action_items', min: 5, label: 'Action items' },
    { schema: 'callpilot', table: 'suggested_updates', min: 5, label: 'Suggested updates' },
    { schema: 'callpilot', table: 'user_profiles', min: 1, label: 'CallPilot user profile' },
    { schema: 'claw', table: 'email_rules', min: 6, label: 'Email rules' },
  ];

  for (const check of checks) {
    const client = check.schema === 'public' ? supabase : supabase.schema(check.schema);
    const { count, error } = await client
      .from(check.table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', USER_ID);

    if (error) {
      console.log(`  FAIL ${check.label}: ${error.message}`);
      allPassed = false;
    } else if (count < check.min) {
      console.log(`  FAIL ${check.label}: ${count} found (need >= ${check.min})`);
      allPassed = false;
    } else {
      console.log(`  OK   ${check.label}: ${count} records`);
    }
  }

  // Check trust config has action_overrides populated
  const { data: tc } = await supabase
    .schema('claw')
    .from('trust_config')
    .select('action_overrides')
    .eq('user_id', USER_ID)
    .single();

  if (tc?.action_overrides && Object.keys(tc.action_overrides).length > 0) {
    console.log('  OK   Trust config: action_overrides populated');
  } else {
    console.log('  FAIL Trust config: action_overrides empty');
    allPassed = false;
  }

  // Check Marcus Thompson has correct phone
  const { data: marcus } = await supabase
    .schema('crm')
    .from('leads')
    .select('phone')
    .eq('name', 'Marcus Thompson')
    .eq('user_id', USER_ID)
    .single();

  if (marcus?.phone === USER_PHONE) {
    console.log(`  OK   Marcus Thompson: phone ${USER_PHONE}`);
  } else {
    console.log(`  FAIL Marcus Thompson: wrong phone (${marcus?.phone || 'not found'})`);
    allPassed = false;
  }

  // Check seed log tracking
  const { count: seedCount } = await supabase
    .from('demo_seed_log')
    .select('*', { count: 'exact', head: true })
    .eq('seed_batch', SEED_BATCH);

  console.log(`  ${seedCount > 0 ? 'OK  ' : 'WARN'} demo_seed_log: ${seedCount || 0} tracked records`);

  console.log(`\n${allPassed ? 'All checks passed!' : 'Some checks failed. Run "create" first.'}`);
  return allPassed;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function create() {
  console.log('Creating demo seed data...\n');

  // Order matters: parents before children
  await seedLeads();
  await seedContacts();
  await seedInvestorProperty();
  await seedPropertyImages();
  await seedLandlordProperties();
  await seedVendor();
  await seedDeal();
  await seedConnections();
  await seedTrustConfig();
  await seedCostLog();
  await seedStagedCallTranscript();
  await seedEmailRules();
  await seedCallPilotProfile();

  console.log('\nDemo seed complete!');
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'create':
      await create();
      break;
    case 'delete':
      await seedDelete();
      break;
    case 'reset':
      console.log('Resetting demo data...\n');
      await seedDelete();
      await create();
      break;
    case 'verify':
      await verify();
      break;
    default:
      console.log(
        [
          'Demo Seed Script — Usage:',
          '  node scripts/demo-seed.js create   Insert all demo data',
          '  node scripts/demo-seed.js reset    Delete + re-insert (fresh start)',
          '  node scripts/demo-seed.js delete   Remove only seeded records',
          '  node scripts/demo-seed.js verify   Check demo readiness',
        ].join('\n')
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
