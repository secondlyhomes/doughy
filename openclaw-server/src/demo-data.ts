// openclaw-server/src/demo-data.ts
// Server-side demo seed management — called from mobile app buttons
// Mirrors scripts/demo-seed.js but runs on the server (has service role key)

import { Router, Request, Response } from 'express';
import { schemaInsert, schemaQuery, schemaDelete, schemaUpdate, publicInsert, rpcCall } from './claw/db.js';
import { config } from './config.js';

const router = Router();

// ─── Constants ─────────────────────────────────────────────────────────────
const USER_ID = '3aa71532-c4df-4b1a-aabf-6ed1d5efc7ce';
const WORKSPACE_ID = '90886395-a5ba-48c1-b72b-8cdfa07d3854';
const SEED_BATCH = 'demo-feb20';
const USER_PHONE = '+17574723676';

const IDS = {
  marcusThompson: 'a1b2c3d4-0001-4000-8000-000000000001',
  lindaChen: 'a1b2c3d4-0002-4000-8000-000000000002',
  robertDavis: 'a1b2c3d4-0003-4000-8000-000000000003',
  sarahMartinez: 'a1b2c3d4-0004-4000-8000-000000000004',
  mikeJohnson: 'a1b2c3d4-0005-4000-8000-000000000005',
  jamesWilson: 'a1b2c3d4-0006-4000-8000-000000000006',
  mapleDriveProperty: 'a1b2c3d4-0007-4000-8000-000000000007',
  oakAveProperty: 'a1b2c3d4-0008-4000-8000-000000000008',
  elmStProperty: 'a1b2c3d4-0009-4000-8000-000000000009',
  marcusDeal: 'a1b2c3d4-0010-4000-8000-000000000010',
  marcusCall: 'a1b2c3d4-0011-4000-8000-000000000011',
  marcusCallSummary: 'a1b2c3d4-0012-4000-8000-000000000012',
  mikeJohnsonVendor: 'a1b2c3d4-0015-4000-8000-000000000001',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

async function toggleTriggers(schema: string, table: string, enable: boolean): Promise<void> {
  await rpcCall('seed_toggle_triggers', { p_schema: schema, p_table: table, p_enable: enable });
}

async function trackRecord(schema: string, table: string, recordId: string): Promise<void> {
  await publicInsert('demo_seed_log', {
    target_schema: schema,
    target_table: table,
    record_id: recordId,
    seed_batch: SEED_BATCH,
  });
}

async function seedInsert(schema: string, table: string, record: Record<string, unknown>, disableTriggers = false): Promise<boolean> {
  try {
    if (disableTriggers) await toggleTriggers(schema, table, false);
    await schemaInsert(schema, table, record);
    try {
      await trackRecord(schema, table, record.id as string);
    } catch (trackErr: any) {
      console.error(`[DemoSeed] WARN: tracking failed for ${schema}.${table} id=${record.id} — record won't be auto-deleted:`, trackErr.message);
    }
    return true;
  } catch (err: any) {
    if (err.message === 'Duplicate entry') return true; // Already exists
    console.error(`[DemoSeed] Insert ${schema}.${table} failed:`, err.message);
    return false;
  } finally {
    if (disableTriggers) await toggleTriggers(schema, table, true);
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

async function createDemoData(): Promise<{ success: boolean; counts: Record<string, number>; errors: string[] }> {
  const counts: Record<string, number> = {};
  const errors: string[] = [];
  const now = Date.now();

  const track = (key: string, ok: boolean) => {
    counts[key] = (counts[key] || 0) + (ok ? 1 : 0);
    if (!ok) errors.push(`Failed: ${key}`);
  };

  // 1. Leads
  for (const lead of getLeads()) {
    track('leads', await seedInsert('crm', 'leads', lead));
  }

  // 2. Contacts
  for (const contact of getContacts()) {
    track('contacts', await seedInsert('crm', 'contacts', contact));
  }

  // 3. Investor property (needs trigger bypass)
  track('investor_properties', await seedInsert('investor', 'properties', getInvestorProperty(), true));

  // 4. Property images (needs trigger bypass)
  for (const img of getPropertyImages()) {
    track('property_images', await seedInsert('investor', 'property_images', img, true));
  }

  // 5. Landlord properties (needs trigger bypass)
  for (const prop of getLandlordProperties()) {
    track('landlord_properties', await seedInsert('landlord', 'properties', prop, true));
  }

  // 6. Vendor (needs trigger bypass)
  track('vendors', await seedInsert('landlord', 'vendors', getVendor(), true));

  // 7. Deal (needs trigger bypass)
  track('deals', await seedInsert('investor', 'deals_pipeline', getDeal(), true));

  // 8. Connections
  for (const conn of getConnections()) {
    track('connections', await seedInsert('claw', 'connections', conn));
  }

  // 9. Trust config (update by user_id, not id)
  try {
    const resp = await fetch(
      `${config.supabaseUrl}/rest/v1/trust_config?user_id=eq.${USER_ID}`,
      {
        method: 'PATCH',
        headers: {
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'claw',
        },
        body: JSON.stringify({
          action_overrides: {
            send_followup: 'guarded',
            send_first_outreach: 'manual',
            voicemail_drop: 'autonomous',
            update_lead_temp: 'autonomous',
            bland_cold_reengage: 'guarded',
            dispatch_vendor: 'manual',
          },
        }),
      }
    );
    counts.trust_config = resp.ok ? 1 : 0;
  } catch {
    errors.push('Failed: trust_config update');
  }

  // 10. Cost log
  for (const entry of getCostLog(now)) {
    track('cost_log', await seedInsert('claw', 'cost_log', entry));
  }

  // 11. Call + transcript + summary + action items + suggested updates
  track('calls', await seedInsert('callpilot', 'calls', getCall()));

  for (const chunk of getTranscriptChunks()) {
    track('transcript_chunks', await seedInsert('callpilot', 'transcript_chunks', chunk));
  }

  track('call_summaries', await seedInsert('callpilot', 'call_summaries', getCallSummary()));

  for (const item of getActionItems()) {
    track('action_items', await seedInsert('callpilot', 'action_items', item));
  }

  for (const update of getSuggestedUpdates()) {
    track('suggested_updates', await seedInsert('callpilot', 'suggested_updates', update));
  }

  return { success: errors.length === 0, counts, errors };
}

// ─── Delete ────────────────────────────────────────────────────────────────

async function deleteDemoData(): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  // Read tracking log
  let logs: any[];
  try {
    logs = await schemaQuery<any>('public', 'demo_seed_log', `seed_batch=eq.${SEED_BATCH}&order=created_at.desc`);
  } catch {
    return { success: false, deleted: 0, errors: ['Failed to read demo_seed_log'] };
  }

  if (logs.length === 0) {
    return { success: true, deleted: 0, errors: [] };
  }

  // Group by schema.table
  const groups: Record<string, string[]> = {};
  for (const log of logs) {
    const key = `${log.target_schema}.${log.target_table}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log.record_id);
  }

  // Delete in reverse dependency order
  const deleteOrder = [
    'callpilot.suggested_updates', 'callpilot.action_items', 'callpilot.call_summaries',
    'callpilot.transcript_chunks', 'callpilot.calls',
    'claw.cost_log', 'claw.connections',
    'investor.deals_pipeline', 'investor.property_images', 'investor.properties',
    'landlord.vendors', 'landlord.properties',
    'crm.leads', 'crm.contacts',
  ];

  const triggerTables = ['investor.properties', 'investor.property_images', 'investor.deals_pipeline', 'landlord.properties', 'landlord.vendors'];

  for (const key of deleteOrder) {
    if (!groups[key]) continue;
    const [schema, table] = key.split('.');
    const ids = groups[key];

    try {
      if (triggerTables.includes(key)) await toggleTriggers(schema, table, false);
      const ok = await schemaDelete(schema, table, ids);
      if (triggerTables.includes(key)) await toggleTriggers(schema, table, true);
      if (ok) deleted += ids.length;
      else errors.push(`Failed to delete from ${key}`);
    } catch (err: any) {
      errors.push(`${key}: ${err.message}`);
      if (triggerTables.includes(key)) {
        try { await toggleTriggers(schema, table, true); } catch {}
      }
    }
  }

  // Handle any untracked groups
  for (const key of Object.keys(groups)) {
    if (deleteOrder.includes(key)) continue;
    const [schema, table] = key.split('.');
    try {
      await schemaDelete(schema, table, groups[key]);
      deleted += groups[key].length;
    } catch (err: any) {
      errors.push(`${key}: ${err.message}`);
    }
  }

  // Reset trust config
  try {
    await fetch(
      `${config.supabaseUrl}/rest/v1/trust_config?user_id=eq.${USER_ID}`,
      {
        method: 'PATCH',
        headers: {
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'claw',
        },
        body: JSON.stringify({ action_overrides: {} }),
      }
    );
  } catch {}

  // Clean tracking table
  try {
    await fetch(
      `${config.supabaseUrl}/rest/v1/demo_seed_log?seed_batch=eq.${SEED_BATCH}`,
      {
        method: 'DELETE',
        headers: {
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
        },
      }
    );
  } catch {}

  return { success: errors.length === 0, deleted, errors };
}

// ─── Verify ────────────────────────────────────────────────────────────────

async function verifyDemoData(): Promise<{ ready: boolean; checks: Record<string, { count: number; expected: number; ok: boolean }> }> {
  const checks: Record<string, { count: number; expected: number; ok: boolean }> = {};
  const specs = [
    { schema: 'crm', table: 'leads', min: 3, label: 'leads' },
    { schema: 'crm', table: 'contacts', min: 3, label: 'contacts' },
    { schema: 'investor', table: 'properties', min: 1, label: 'investor_properties' },
    { schema: 'landlord', table: 'properties', min: 2, label: 'landlord_properties' },
    { schema: 'landlord', table: 'vendors', min: 1, label: 'vendors' },
    { schema: 'investor', table: 'deals_pipeline', min: 1, label: 'deals' },
    { schema: 'claw', table: 'connections', min: 6, label: 'connections' },
    { schema: 'callpilot', table: 'calls', min: 1, label: 'calls' },
    { schema: 'callpilot', table: 'action_items', min: 5, label: 'action_items' },
    { schema: 'callpilot', table: 'suggested_updates', min: 6, label: 'suggested_updates' },
  ];

  let ready = true;
  for (const spec of specs) {
    try {
      const rows = await schemaQuery(spec.schema, spec.table, `user_id=eq.${USER_ID}&select=id`);
      const count = rows.length;
      const ok = count >= spec.min;
      checks[spec.label] = { count, expected: spec.min, ok };
      if (!ok) ready = false;
    } catch {
      checks[spec.label] = { count: 0, expected: spec.min, ok: false };
      ready = false;
    }
  }

  return { ready, checks };
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  const { action } = req.body;

  if (!['create', 'delete', 'reset', 'verify'].includes(action)) {
    return res.status(400).json({ error: 'action must be create, delete, reset, or verify' });
  }

  try {
    switch (action) {
      case 'create': {
        const result = await createDemoData();
        return res.json(result);
      }
      case 'delete': {
        const result = await deleteDemoData();
        return res.json(result);
      }
      case 'reset': {
        const delResult = await deleteDemoData();
        const createResult = await createDemoData();
        return res.json({
          success: createResult.success,
          deleted: delResult.deleted,
          counts: createResult.counts,
          errors: [...delResult.errors, ...createResult.errors],
        });
      }
      case 'verify': {
        const result = await verifyDemoData();
        return res.json(result);
      }
    }
  } catch (err: any) {
    console.error('[DemoData] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export const demoDataRouter = router;

// ─── Data Definitions ──────────────────────────────────────────────────────

function getLeads() {
  return [
    {
      id: IDS.marcusThompson, user_id: USER_ID, name: 'Marcus Thompson', phone: USER_PHONE,
      email: 'marcus.t@email.com', module: 'investor', status: 'active', source: 'direct_mail',
      score: 92, tags: ['hot', 'creative_finance', 'inherited'],
      address_line_1: '8234 Maple Drive', city: 'Fairfax', state: 'VA', zip: '22030',
      notes: 'Inherited property from grandmother. Lives in Texas. Property vacant 8 months. Behind on taxes 2 years. Motivated — wants to sell within 60 days. Open to creative finance.',
      review_status: 'reviewed', is_conversation_started: true,
    },
    {
      id: IDS.lindaChen, user_id: USER_ID, name: 'Linda Chen', phone: '+15715559876',
      module: 'investor', status: 'active', source: 'cold_call', score: 68,
      tags: ['warm', 'tired_landlord', 'free_and_clear'],
      address_line_1: '1547 Oak Street', city: 'Arlington', state: 'VA', zip: '22201',
      notes: 'Tired landlord. Owns duplex free and clear. Considering selling but not in a rush.',
      review_status: 'reviewed',
    },
    {
      id: IDS.robertDavis, user_id: USER_ID, name: 'Robert Davis', phone: '+17035557777',
      module: 'investor', status: 'active', source: 'other', score: 25,
      tags: ['cold', 'absentee', 'skip_trace'],
      address_line_1: '920 Pine Lane', city: 'Centreville', state: 'VA', zip: '20120',
      notes: 'Absentee owner. No answer x3. Left voicemail twice.', review_status: 'reviewed',
    },
  ];
}

function getContacts() {
  return [
    {
      id: IDS.sarahMartinez, user_id: USER_ID, first_name: 'Sarah', last_name: 'Martinez',
      phone: '+15715558888', email: 'sarah.m@email.com', module: 'landlord',
      contact_types: ['tenant'], status: 'active',
      notes: 'Unit 3, 456 Oak Ave. Lease through Feb 2027. Quiet, pays on time.',
      tags: ['tenant', 'good_standing'],
    },
    {
      id: IDS.mikeJohnson, user_id: USER_ID, first_name: 'Mike', last_name: 'Johnson',
      phone: USER_PHONE, email: 'mike@mikesplumbing.com', company: "Mike's Plumbing",
      module: 'landlord', contact_types: ['vendor'], status: 'active',
      notes: 'Reliable plumber. Usually responds within 2 hours. Rate: $85/hour.',
      tags: ['vendor', 'plumbing', 'preferred'],
    },
    {
      id: IDS.jamesWilson, user_id: USER_ID, first_name: 'James', last_name: 'Wilson',
      email: 'j.wilson@email.com', module: 'landlord', contact_types: ['guest'], status: 'new',
      source: 'furnishedfinder',
      notes: 'Furnished Finder inquiry. Travel nurse. 3-month stay starting March 1. Budget $1800/mo.',
      tags: ['guest', 'travel_nurse', 'inquiry'],
    },
  ];
}

function getInvestorProperty() {
  return {
    id: IDS.mapleDriveProperty, user_id: USER_ID, workspace_id: WORKSPACE_ID,
    address_line_1: '8234 Maple Drive', city: 'Fairfax', state: 'VA', zip: '22030',
    bedrooms: 3, bathrooms: 2, square_feet: 1850, year_built: 1998,
    purchase_price: 175000, arv: 320000, status: 'under_contract',
    property_type: 'single_family', is_vacant: true, is_owner_occupied: false,
    lead_id: IDS.marcusThompson,
    primary_image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    notes: 'Inherited by Marcus Thompson. Vacant 8 months. Roof needs full replacement. HVAC original from 1998.',
    tags: ['inherited', 'vacant', 'needs_repairs', 'creative_finance'],
    mortgage_info: { existing_balance: 95000, interest_rate: 3.5, type: 'subject_to', seller_finance_amount: 80000, seller_finance_rate: 5.0, seller_finance_term_years: 15 },
  };
}

function getPropertyImages() {
  const images = [
    { suffix: '01', url: 'photo-1568605114967-8130f3a36994', label: 'Front exterior', is_primary: true },
    { suffix: '02', url: 'photo-1600596542815-ffad4c1539a9', label: 'Side view', is_primary: false },
    { suffix: '03', url: 'photo-1600585154340-be6161a56a0c', label: 'Living room', is_primary: false },
    { suffix: '04', url: 'photo-1600607687939-ce8a6c25118c', label: 'Kitchen', is_primary: false },
    { suffix: '05', url: 'photo-1600566753190-17f0baa2a6c3', label: 'Backyard', is_primary: false },
  ];
  return images.map(img => ({
    id: `a1b2c3d4-0070-4000-8000-0000000000${img.suffix}`,
    property_id: IDS.mapleDriveProperty,
    url: `https://images.unsplash.com/${img.url}?w=800&q=80`,
    label: img.label, is_primary: img.is_primary,
    uploaded_by: USER_ID, workspace_id: WORKSPACE_ID,
  }));
}

function getLandlordProperties() {
  return [
    {
      id: IDS.oakAveProperty, user_id: USER_ID, workspace_id: WORKSPACE_ID,
      name: '456 Oak Ave', address: '456 Oak Ave', city: 'Falls Church', state: 'VA', zip: '22046',
      property_type: 'multi_family', rental_type: 'mtr', bedrooms: 4, bathrooms: 4,
      square_feet: 3200, base_rate: 1700, rate_type: 'monthly', status: 'active',
      primary_image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
      description: '4-unit multi-family. 3 occupied, 1 being turned.',
      internal_notes: '4 units. 75% occupancy. Monthly revenue $6,800.',
    },
    {
      id: IDS.elmStProperty, user_id: USER_ID, workspace_id: WORKSPACE_ID,
      name: '789 Elm St', address: '789 Elm St', city: 'Fairfax', state: 'VA', zip: '22030',
      property_type: 'single_family', rental_type: 'mtr', bedrooms: 3, bathrooms: 2,
      square_feet: 1800, base_rate: 1700, rate_type: 'monthly', is_room_by_room_enabled: true,
      status: 'active',
      primary_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      description: '3-bed SFH. Room-by-room rental. Fully occupied.',
      internal_notes: '3 rooms. 100% occupancy. Monthly revenue $5,100.',
    },
  ];
}

function getVendor() {
  return {
    id: IDS.mikeJohnsonVendor, user_id: USER_ID, workspace_id: WORKSPACE_ID,
    property_id: IDS.oakAveProperty, category: 'plumber',
    name: 'Mike Johnson', company_name: 'Johnson Plumbing LLC',
    phone: USER_PHONE, email: 'mike@mikesplumbing.com',
    is_primary: true, preferred_contact_method: 'phone',
    availability_notes: 'Usually responds within 2 hours.',
    hourly_rate: 85, service_fee: 75, rating: 5, total_jobs: 8, is_active: true,
    notes: 'Preferred plumber. Fast response, fair prices.',
  };
}

function getDeal() {
  return {
    id: IDS.marcusDeal, user_id: USER_ID, workspace_id: WORKSPACE_ID,
    lead_id: IDS.marcusThompson, property_id: IDS.mapleDriveProperty,
    status: 'active', stage: 'due_diligence',
    title: 'Marcus Thompson — 8234 Maple Drive (Subject-To)',
    estimated_value: 175000, probability: 75, expected_close_date: '2026-03-15',
    next_action: 'Schedule inspection walkthrough',
    next_action_due: new Date(Date.now() + 3 * 86400000).toISOString(),
    notes: 'Offer accepted at $175k. Subject-to existing mortgage ($95k at 3.5%) + $80k seller finance at 5% over 15 years. Repair estimate $35k. ARV $320k.',
  };
}

function getConnections() {
  return [
    { id: 'a1b2c3d4-0020-4000-8000-000000000001', user_id: USER_ID, channel: 'doughy', status: 'connected', label: 'CRM \u00b7 synced' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000002', user_id: USER_ID, channel: 'whatsapp', status: 'connected', label: 'Active' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000003', user_id: USER_ID, channel: 'discord', status: 'connected', label: '#claw-channel' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000004', user_id: USER_ID, channel: 'bland', status: 'connected', label: '0 calls today' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000005', user_id: USER_ID, channel: 'sms', status: 'warning', label: 'Active \u00b7 costs $ vs WhatsApp' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000006', user_id: USER_ID, channel: 'gmail', status: 'connected', label: 'admin@doughy.app \u00b7 reading inbox', config: { read_inbox: true, draft_replies: true, send_replies: false } },
    { id: 'a1b2c3d4-0020-4000-8000-000000000007', user_id: USER_ID, channel: 'slack', status: 'disconnected' },
    { id: 'a1b2c3d4-0020-4000-8000-000000000008', user_id: USER_ID, channel: 'hubspot', status: 'disconnected' },
  ];
}

function getCostLog(now: number) {
  return [
    { id: 'a1b2c3d4-0030-4000-8000-000000000001', user_id: USER_ID, service: 'anthropic', action: 'morning_briefing', input_tokens: 2400, output_tokens: 850, cost_cents: 4, metadata: { model: 'claude-sonnet-4-5-20250929', channel: 'sms' }, created_at: new Date(now - 2 * 3600000).toISOString() },
    { id: 'a1b2c3d4-0030-4000-8000-000000000002', user_id: USER_ID, service: 'bland', action: 'cold_call_linda_chen', input_tokens: 0, output_tokens: 0, duration_seconds: 45, cost_cents: 45, metadata: { lead: 'Linda Chen', result: 'voicemail' }, created_at: new Date(now - 90 * 60000).toISOString() },
    { id: 'a1b2c3d4-0030-4000-8000-000000000003', user_id: USER_ID, service: 'twilio', action: 'follow_up_sms', input_tokens: 0, output_tokens: 0, cost_cents: 1, metadata: { lead: 'Robert Davis', channel: 'sms' }, created_at: new Date(now - 60 * 60000).toISOString() },
    { id: 'a1b2c3d4-0030-4000-8000-000000000004', user_id: USER_ID, service: 'anthropic', action: 'draft_generation', input_tokens: 1800, output_tokens: 320, cost_cents: 3, metadata: { model: 'claude-haiku-4-5-20251001', lead: 'Marcus Thompson' }, created_at: new Date(now - 30 * 60000).toISOString() },
    { id: 'a1b2c3d4-0030-4000-8000-000000000005', user_id: USER_ID, service: 'anthropic', action: 'intent_classification', input_tokens: 600, output_tokens: 50, cost_cents: 1, metadata: { model: 'claude-haiku-4-5-20251001', intent: 'greeting' }, created_at: new Date(now - 15 * 60000).toISOString() },
  ];
}

function getCall() {
  const callStarted = new Date(Date.now() - 4 * 3600000);
  return {
    id: IDS.marcusCall, user_id: USER_ID, lead_id: IDS.marcusThompson, deal_id: IDS.marcusDeal,
    direction: 'outbound', phone_number: USER_PHONE, status: 'completed',
    started_at: callStarted.toISOString(),
    ended_at: new Date(callStarted.getTime() + 12 * 60000).toISOString(),
    duration_seconds: 720, transcription_status: 'completed', transcript_chunk_count: 24,
    caller_type: 'investor', metadata: { demo: true },
  };
}

function getTranscriptChunks() {
  const lines = [
    { s: 'user', o: 0, t: "Hey Marcus, this is Dino from Doughy Investments. Thanks for getting back to me on that letter we sent out." },
    { s: 'contact', o: 8, t: "Hey Dino, yeah I got your letter about the house on Maple Drive. I've been meaning to call you back." },
    { s: 'user', o: 18, t: "So tell me a little bit about the property. The letter mentioned it was on Maple Drive in Fairfax?" },
    { s: 'contact', o: 28, t: "Yeah, 8234 Maple Drive. It was my grandmother's house. She passed away about a year ago and left it to me and my sister." },
    { s: 'user', o: 42, t: "I'm sorry to hear about your grandmother. So you and your sister inherited it \u2014 is she local?" },
    { s: 'contact', o: 52, t: "No, she's down in Florida. Neither of us live near the property. It's been sitting vacant for about 8 months." },
    { s: 'user', o: 65, t: "Vacant properties can be a real burden, especially from out of state. What's the current condition?" },
    { s: 'contact', o: 78, t: "The roof definitely needs to be completely replaced. And the heating and cooling, that's the original unit from '98." },
    { s: 'user', o: 95, t: "A new roof and HVAC. Those are significant repairs. Are there any other major issues?" },
    { s: 'contact', o: 108, t: "The bones are good. Foundation is solid, electrical was updated about 10 years ago." },
    { s: 'user', o: 120, t: "Good news structurally. Are there any financial pressures on the property right now?" },
    { s: 'contact', o: 135, t: "We're behind on the property taxes \u2014 about two years. And there's still a mortgage, about 95 thousand at three and a half percent." },
    { s: 'user', o: 155, t: "The existing mortgage at 3.5% is actually really favorable. What price range are you looking for?" },
    { s: 'contact', o: 172, t: "I was thinking around 180, but if we can do something creative with the financing, 175 would work." },
    { s: 'user', o: 195, t: "What if we take over the existing mortgage payments \u2014 a subject-to deal \u2014 and work out seller financing for the difference?" },
    { s: 'contact', o: 215, t: "So I wouldn't have to worry about the mortgage payments anymore? And you'd handle the back taxes?" },
    { s: 'user', o: 228, t: "Exactly. We'd bring the taxes current, take over the mortgage, and give you a note for the remaining equity." },
    { s: 'contact', o: 245, t: "I like that. My sister would like that too \u2014 she said whatever I decide, she's good with it." },
    { s: 'user', o: 260, t: "Can she sign remotely, or would we need to arrange something special since she's in Florida?" },
    { s: 'contact', o: 275, t: "She should be able to do it remotely. If not, she could give me power of attorney." },
    { s: 'user', o: 290, t: "Great. I'd love to come see the property this week for a walkthrough inspection. Then I'll get quotes on the roof." },
    { s: 'contact', o: 310, t: "That sounds good. I can give you the lockbox code. I really want to get this done in the next 60 days." },
    { s: 'user', o: 330, t: "I'll put together a comp analysis showing you what similar properties in the area have sold for." },
    { s: 'contact', o: 345, t: "I'd appreciate that. Thanks Dino, I feel good about this. Let me know when you want to come by." },
  ];
  return lines.map((l, i) => ({
    id: `a1b2c3d4-00${String(60 + i).padStart(2, '0')}-4000-8000-000000000001`,
    call_id: IDS.marcusCall, speaker: l.s, content: l.t,
    confidence: 0.95, timestamp_ms: l.o * 1000, duration_ms: 10000,
  }));
}

function getCallSummary() {
  return {
    id: IDS.marcusCallSummary, call_id: IDS.marcusCall, user_id: USER_ID,
    summary: "Productive 12-minute call with Marcus Thompson about inherited property at 8234 Maple Drive, Fairfax VA. Vacant 8 months, needs roof + HVAC. Open to subject-to ($95k at 3.5%) + seller finance. Asking ~$180k flexible. Sister on deed (FL), on board. 2 years behind on taxes. Next: inspection this week, roof quotes, draft offer at $175k.",
    sentiment: 'positive',
    key_points: ['Inherited, vacant 8 months', 'Motivated to sell within 60 days', 'Open to creative finance', 'Roof + HVAC needed', 'Sister on deed (FL), on board', '2 years behind on taxes', 'Asking ~$180k flexible'],
    lead_temperature: 'hot',
    closing_recommendation: 'Strong buy signal. Subject-to offer at $175k with seller finance should close. Move quickly.',
    unanswered_questions: ['Exact tax arrears amount', 'Can sister sign remotely?', 'Any liens besides mortgage/taxes?', 'Foundation and electrical condition?'],
  };
}

function getActionItems() {
  return [
    { id: 'a1b2c3d4-0040-4000-8000-000000000001', call_id: IDS.marcusCall, user_id: USER_ID, description: 'Schedule inspection walkthrough this week', category: 'follow_up', due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], status: 'pending', metadata: { priority: 'high' } },
    { id: 'a1b2c3d4-0040-4000-8000-000000000002', call_id: IDS.marcusCall, user_id: USER_ID, description: 'Get roof replacement quotes (2+ contractors)', category: 'research', due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'pending', metadata: { priority: 'high' } },
    { id: 'a1b2c3d4-0040-4000-8000-000000000003', call_id: IDS.marcusCall, user_id: USER_ID, description: 'Draft subject-to offer at $175k with seller finance terms', category: 'document', due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], status: 'pending', metadata: { priority: 'high' } },
    { id: 'a1b2c3d4-0040-4000-8000-000000000004', call_id: IDS.marcusCall, user_id: USER_ID, description: 'Confirm sister can sign remotely or arrange POA', category: 'follow_up', due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'pending', metadata: { priority: 'medium' } },
    { id: 'a1b2c3d4-0040-4000-8000-000000000005', call_id: IDS.marcusCall, user_id: USER_ID, description: 'Send comp analysis to Marcus via email', category: 'follow_up', due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], status: 'pending', metadata: { priority: 'medium' } },
  ];
}

function getSuggestedUpdates() {
  return [
    { id: 'a1b2c3d4-0050-4000-8000-000000000001', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'crm.leads', target_record_id: IDS.marcusThompson, field_name: 'tags', current_value: 'hot, creative_finance, inherited', suggested_value: 'hot, creative_finance, inherited, motivated_seller, tax_delinquent', confidence: 'high', source_quote: "I really want to get this done in the next 60 days... the taxes are killing me", status: 'pending' },
    { id: 'a1b2c3d4-0050-4000-8000-000000000002', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'crm.leads', target_record_id: IDS.marcusThompson, field_name: 'notes', current_value: null, suggested_value: 'Timeline: 60 days. Asking $180k flexible. Behind on taxes 2 years. Sister on deed (FL, on board). Open to subject-to + seller finance.', confidence: 'high', source_quote: null, status: 'pending' },
    { id: 'a1b2c3d4-0050-4000-8000-000000000003', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'investor.properties', target_record_id: IDS.mapleDriveProperty, field_name: 'notes', current_value: null, suggested_value: 'Roof: full replacement needed. HVAC: original 1998. Vacant 8 months. Back taxes: 2 years.', confidence: 'high', source_quote: "The roof definitely needs to be completely replaced", status: 'pending' },
    { id: 'a1b2c3d4-0050-4000-8000-000000000004', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'investor.deals_pipeline', target_record_id: IDS.marcusDeal, field_name: 'stage', current_value: 'due_diligence', suggested_value: 'due_diligence', confidence: 'high', source_quote: null, status: 'pending' },
    { id: 'a1b2c3d4-0050-4000-8000-000000000005', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'investor.properties', target_record_id: IDS.mapleDriveProperty, field_name: 'mortgage_info', current_value: null, suggested_value: JSON.stringify({ existing_balance: 95000, interest_rate: 3.5, type: 'subject_to', seller_finance_amount: 80000, seller_finance_rate: 5.0, seller_finance_term_years: 15 }), confidence: 'high', source_quote: "There's still about 95 thousand on the mortgage at three and a half percent", status: 'pending' },
    { id: 'a1b2c3d4-0050-4000-8000-000000000006', call_id: IDS.marcusCall, user_id: USER_ID, target_table: 'crm.leads', target_record_id: IDS.marcusThompson, field_name: 'score', current_value: '92', suggested_value: '95', confidence: 'medium', source_quote: null, status: 'pending' },
  ];
}
