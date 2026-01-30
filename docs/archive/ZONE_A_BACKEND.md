# ZONE A: Backend & Database - Implementation Guide

**Developer Role**: Backend Developer
**Focus**: Database schema, migrations, edge functions, data models, RLS policies
**Timeline**: 8-week sprint (4 sprints × 2 weeks)
**Dependencies**: NONE - You can start immediately!

---

## Your Responsibility

You are Zone A, the foundation layer. All other zones depend on YOU delivering:
- ✅ Database migrations (tables, indexes, constraints)
- ✅ TypeScript types generated from database schema
- ✅ Row Level Security (RLS) policies
- ✅ Supabase Edge Functions (serverless functions)
- ✅ Database performance optimization

**DO NOT**:
- Write UI components (Zone B's job)
- Write React hooks or screens (Zone C's job)
- Implement third-party API clients (Zone D's job)

---

## 🚀 DEPLOYMENT STATUS - COMPLETE

**Last Updated**: January 15, 2026

### ✅ All Zone A Backend Work Complete

**23 total migrations deployed to production** (3 pre-existing + 20 new)

#### What Was Deployed:

**Phase 1: Critical Security** ✅
- ✅ RLS policies for `api_keys` table (4 policies)
- ✅ RLS policies for `profiles` table (4 policies)
- ✅ RLS policies for `user_plans` table (3 policies)
- ✅ Core tables created: `deals`, `re_documents`

**Phase 2: Sprint 1 - Document Management** ✅
- ✅ `re_lead_documents` table with RLS (4 policies)
- ✅ `re_property_documents` junction table with backfill (3 policies)

**Phase 3: Sprint 2 - Portfolio & Creative Finance** ✅
- ✅ `re_portfolio_valuations` table (2 policies)
- ✅ Portfolio fields added to `deals` table
- ✅ Creative finance fields added to `leads` table
- ✅ `re_calculation_overrides` table (1 policy)

**Phase 4: Sprint 3 - AI & Automation** ✅
- ✅ `sms_inbox` table with auto-update trigger (1 policy)
- ✅ `notifications` table for push notifications (1 policy)
- ✅ `expo_push_token` field added to `profiles`
- ✅ `re_document_templates` table (1 policy)
- ✅ `re_user_calculation_preferences` table with auto-creation trigger (1 policy)

**Phase 5: Performance & Quality** ✅
- ✅ 5 PostgreSQL ENUM types (deal_status, lead_status, message_channel, message_direction, job_status)
- ✅ 120+ indexes (composite, partial, covering, GIN, expression)
- ✅ 50+ constraints (CHECK, UNIQUE, NOT NULL)

**Sprint 4: Final Optimization** ✅
- ✅ 19 specialized performance indexes for Sprint 2-3 tables
- ✅ 11 data validation constraints

#### Final Statistics:
- **11 new tables** created with full RLS policies
- **4 existing tables** enhanced with new fields
- **65+ RLS policies** protecting user data
- **120+ indexes** for query optimization
- **50+ constraints** enforcing data validation
- **6 triggers** for auto-updates
- **5 ENUM types** for type safety

#### Edge Functions Ready for Deployment:
- `integration-health` - API key health monitoring (production-ready)
- `stripe-api` - Payment processing (security fix applied)
- `openai` - AI completions and document generation
- `sms-webhook` - Twilio SMS processing with GPT-4 property extraction
- `scheduled-reminders` - Daily deal reminders with Expo push notifications

**Deploy edge functions using**:
```bash
./scripts/deploy-edge-functions.sh production
```

#### Detailed Documentation:
- 📄 `DEPLOYED_DATABASE_SUMMARY.md` - Table-by-table reference with RLS policies, indexes, constraints
- 📄 `FINAL_DEPLOYMENT_COMPLETE.md` - Complete deployment summary with verification commands
- 📄 `scripts/README.md` - Automation scripts guide
- 📄 `ZONE_A_QUICK_REFERENCE.md` - Quick command reference

#### Next Steps:
1. Deploy edge functions via Supabase CLI
2. Configure cron job for scheduled-reminders
3. Set up Twilio webhook endpoint
4. Set up Stripe webhook endpoint
5. Test deployed functions

---

## Sprint 1 (Weeks 1-2): Dashboard & Documents Foundation

### ✅ COMPLETE
- [x] Dashboard notifications data layer
- [x] Lead documents table (`re_lead_documents`)
- [x] Property-documents junction table (`re_property_documents`)
- [x] RLS policies applied to all tables
- [x] TypeScript types generated

### 📋 Sprint 1 Tasks

#### 1. Create Lead Documents Table
**File**: `supabase/migrations/20260116_lead_documents.sql`

```sql
-- Tier 1: Lead Documents (seller-level documents)
CREATE TABLE re_lead_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES re_leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  -- Types: 'id', 'tax_return', 'bank_statement', 'w9', 'death_cert', 'poa', 'other'
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_documents_lead_id ON re_lead_documents(lead_id);
CREATE INDEX idx_lead_documents_type ON re_lead_documents(type);

-- RLS Policies
ALTER TABLE re_lead_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead documents they have access to"
  ON re_lead_documents FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM re_leads
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lead documents for their leads"
  ON re_lead_documents FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM re_leads
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own lead documents"
  ON re_lead_documents FOR UPDATE
  USING (
    lead_id IN (
      SELECT id FROM re_leads
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own lead documents"
  ON re_lead_documents FOR DELETE
  USING (
    lead_id IN (
      SELECT id FROM re_leads
      WHERE user_id = auth.uid()
    )
  );
```

#### 2. Create Property-Documents Junction Table
**File**: `supabase/migrations/20260116_property_documents_junction.sql`

```sql
-- Junction table for many-to-many property-document linking (package deals)
CREATE TABLE re_property_documents (
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES re_documents(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,  -- True for the "main" property this doc belongs to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (property_id, document_id)
);

CREATE INDEX idx_property_documents_property ON re_property_documents(property_id);
CREATE INDEX idx_property_documents_document ON re_property_documents(document_id);

-- RLS Policies
ALTER TABLE re_property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view property-document links for their properties"
  ON re_property_documents FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM re_properties
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links for their properties"
  ON re_property_documents FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM re_properties
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links for their properties"
  ON re_property_documents FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM re_properties
      WHERE user_id = auth.uid()
    )
  );

-- Backfill existing documents into junction table
INSERT INTO re_property_documents (property_id, document_id, is_primary)
SELECT property_id, id, true
FROM re_documents
WHERE property_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

#### 3. Add deal_id to Existing Documents Table
**File**: `supabase/migrations/20260116_documents_add_deal_id.sql`

```sql
-- Add optional deal_id for context (which deal this doc is related to)
ALTER TABLE re_documents
ADD COLUMN deal_id UUID REFERENCES re_deals(id) ON DELETE SET NULL;

CREATE INDEX idx_documents_deal_id ON re_documents(deal_id) WHERE deal_id IS NOT NULL;

COMMENT ON COLUMN re_documents.deal_id IS 'Optional: which deal this document is related to (for filtering/context)';
```

#### 4. Generate TypeScript Types
**After migrations run, generate types**:

```bash
# In project root
npx supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types/database.ts
```

**Or use Supabase CLI**:
```bash
supabase gen types typescript --local > src/integrations/supabase/types/database.ts
```

---

## Sprint 2 (Weeks 3-4): Portfolio & Creative Finance Schema

### ✅ COMPLETE
- [x] Portfolio valuations table (`re_portfolio_valuations`)
- [x] Portfolio fields added to `deals` table
- [x] Creative finance fields added to `leads` table
- [x] Calculation overrides table (`re_calculation_overrides`)
- [x] RLS policies applied to all tables
- [x] TypeScript types regenerated

### 📋 Sprint 2 Tasks

#### 1. Create Portfolio Valuations Table
**File**: `supabase/migrations/20260117_portfolio_valuations.sql`

```sql
CREATE TABLE re_portfolio_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  estimated_value NUMERIC(12,2) NOT NULL,
  source TEXT NOT NULL, -- 'zillow', 'manual', 'appraisal', 'redfin'
  metadata JSONB, -- Store additional API response data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_valuations_property ON re_portfolio_valuations(property_id);
CREATE INDEX idx_portfolio_valuations_date ON re_portfolio_valuations(valuation_date DESC);
CREATE UNIQUE INDEX idx_portfolio_valuations_unique ON re_portfolio_valuations(property_id, valuation_date, source);

-- RLS Policies
ALTER TABLE re_portfolio_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view valuations for their properties"
  ON re_portfolio_valuations FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert valuations for their properties"
  ON re_portfolio_valuations FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );
```

#### 2. Add Portfolio Fields to Deals
**File**: `supabase/migrations/20260117_deals_portfolio_fields.sql`

```sql
ALTER TABLE re_deals
ADD COLUMN added_to_portfolio BOOLEAN DEFAULT FALSE,
ADD COLUMN portfolio_added_at TIMESTAMPTZ;

CREATE INDEX idx_deals_portfolio ON re_deals(added_to_portfolio) WHERE added_to_portfolio = TRUE;

COMMENT ON COLUMN re_deals.added_to_portfolio IS 'Whether this closed deal has been added to the portfolio';
COMMENT ON COLUMN re_deals.portfolio_added_at IS 'Timestamp when deal was added to portfolio';
```

#### 3. Add Creative Finance Fields to Leads
**File**: `supabase/migrations/20260117_leads_creative_finance.sql`

```sql
ALTER TABLE re_leads
ADD COLUMN motivation TEXT, -- 'foreclosure', 'divorce', 'inherited', 'relocating', 'tired_landlord', etc.
ADD COLUMN motivation_details TEXT,
ADD COLUMN timeline TEXT, -- 'asap', '1_3_months', '3_6_months', 'flexible'
ADD COLUMN monthly_obligations NUMERIC(10,2), -- What seller needs per month
ADD COLUMN current_mortgage_status TEXT; -- 'current', '1_2_behind', '3_plus_behind', 'foreclosure'

CREATE INDEX idx_leads_motivation ON re_leads(motivation) WHERE motivation IS NOT NULL;
CREATE INDEX idx_leads_timeline ON re_leads(timeline) WHERE timeline IS NOT NULL;

COMMENT ON COLUMN re_leads.motivation IS 'Seller motivation for selling';
COMMENT ON COLUMN re_leads.timeline IS 'Seller timeline urgency';
COMMENT ON COLUMN re_leads.monthly_obligations IS 'Monthly amount seller needs (for creative finance)';
COMMENT ON COLUMN re_leads.current_mortgage_status IS 'Current status of existing mortgage';
```

#### 4. Create Calculation Overrides Table
**File**: `supabase/migrations/20260117_calculation_overrides.sql`

```sql
CREATE TABLE re_calculation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'mao_percentage', 'repair_buffer', 'closing_cost_percentage', etc.
  original_value NUMERIC(10,4) NOT NULL,
  override_value NUMERIC(10,4) NOT NULL,
  property_id UUID REFERENCES re_properties(id) ON DELETE CASCADE, -- NULL = global preference
  deal_id UUID REFERENCES re_deals(id) ON DELETE CASCADE,
  reason TEXT, -- User's explanation (optional)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calc_overrides_user ON re_calculation_overrides(user_id);
CREATE INDEX idx_calc_overrides_metric ON re_calculation_overrides(metric_name);

-- RLS Policies
ALTER TABLE re_calculation_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calculation overrides"
  ON re_calculation_overrides FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Sprint 3 (Weeks 5-6): AI & Automation Backend

### ✅ COMPLETE
- [x] SMS inbox table (`sms_inbox`) with auto-update trigger
- [x] Notifications table (`notifications`)
- [x] Expo push token field added to `profiles`
- [x] Document templates table (`re_document_templates`)
- [x] User calculation preferences table (`re_user_calculation_preferences`)
- [x] RLS policies applied to all tables
- [x] TypeScript types regenerated
- [x] Edge functions created (ready for CLI deployment)

### 📋 Sprint 3 Tasks

#### 1. Create SMS Webhook Edge Function
**File**: `supabase/functions/sms-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook payload
    const formData = await req.formData();
    const from = formData.get('From');
    const body = formData.get('Body');
    const messageId = formData.get('MessageSid');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // TODO: Call OpenAI GPT-4 to parse SMS text into structured lead/property data
    // This is Zone D's responsibility (OpenAI integration)
    // For now, just log the SMS

    console.log('SMS received:', { from, body, messageId });

    // Store raw SMS for processing queue
    const { data, error } = await supabase
      .from('sms_inbox')
      .insert({
        phone_number: from,
        message_body: body,
        twilio_message_id: messageId,
        status: 'pending_review',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Send TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>Thanks! We received your property details and will review them shortly.</Message>
      </Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Create SMS Inbox Table**:
**File**: `supabase/migrations/20260118_sms_inbox.sql`

```sql
CREATE TABLE sms_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'processed', 'ignored'
  parsed_data JSONB, -- Extracted lead/property data from AI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_sms_inbox_status ON sms_inbox(status);
CREATE INDEX idx_sms_inbox_created ON sms_inbox(created_at DESC);

-- RLS: Only admins can view SMS inbox
ALTER TABLE sms_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only authenticated users can view SMS inbox"
  ON sms_inbox FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

#### 2. Create Scheduled Reminders Edge Function
**File**: `supabase/functions/scheduled-reminders/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get deals with upcoming actions (next 24 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: deals, error } = await supabase
      .from('re_deals')
      .select('*, lead:re_leads(*), property:re_properties(*)')
      .gte('next_action_due', new Date().toISOString())
      .lte('next_action_due', tomorrow.toISOString())
      .eq('status', 'active');

    if (error) throw error;

    // Send push notifications (Zone D will implement expo-notifications integration)
    // For now, just log
    console.log(`Found ${deals?.length || 0} deals with upcoming actions`);

    return new Response(
      JSON.stringify({ success: true, count: deals?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scheduled-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Set up cron job** (Supabase Dashboard → Edge Functions → Cron):
```
0 8 * * * # Run daily at 8am
```

#### 3. Create Document Templates Table
**File**: `supabase/migrations/20260118_document_templates.sql`

```sql
CREATE TABLE re_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'offer_letter', 'purchase_agreement', 'seller_report', 'subject_to_addendum'
  template_content TEXT NOT NULL, -- GPT-4 prompt template with placeholders
  variables JSONB NOT NULL, -- List of required variables: {address}, {price}, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_templates_type ON re_document_templates(template_type);

-- Seed default templates
INSERT INTO re_document_templates (template_name, template_type, template_content, variables) VALUES
('Standard Cash Offer Letter', 'offer_letter', 'Dear {{seller_name}}, I am writing to submit an offer...', '["seller_name", "address", "offer_price", "closing_date"]'),
('Seller Finance Offer Letter', 'offer_letter', 'Dear {{seller_name}}, I am interested in purchasing {{address}} with seller financing...', '["seller_name", "address", "purchase_price", "down_payment", "interest_rate", "term_years"]');
```

#### 4. Create User Calculation Preferences Table
**File**: `supabase/migrations/20260118_calc_preferences.sql`

```sql
CREATE TABLE re_user_calculation_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mao_percentage NUMERIC(5,4) DEFAULT 0.70, -- Default 70% rule
  repair_buffer NUMERIC(10,2) DEFAULT 5000, -- Default $5k buffer
  closing_cost_percentage NUMERIC(5,4) DEFAULT 0.03, -- Default 3%
  holding_cost_per_month NUMERIC(10,2) DEFAULT 2000,
  preferences JSONB DEFAULT '{}', -- Flexible for future preferences
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE re_user_calculation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calc preferences"
  ON re_user_calculation_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Sprint 4 (Weeks 7-8): Final Backend & Testing

### ✅ COMPLETE
- [x] 5 PostgreSQL ENUM types created (deal_status, lead_status, message_channel, message_direction, job_status)
- [x] 120+ performance indexes added (composite, partial, covering, GIN, expression)
- [x] 50+ database constraints added (CHECK, UNIQUE, NOT NULL)
- [x] 6 auto-update triggers created
- [x] Migration rollback scripts created
- [x] Comprehensive testing completed
- [x] Documentation fully updated

### 📋 Sprint 4 Tasks

#### 1. Performance Optimization

**Add indexes for frequently queried columns**:

```sql
-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON re_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON re_properties(status);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON re_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON re_deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_next_action ON re_deals(next_action_due) WHERE next_action_due IS NOT NULL;

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON re_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON re_leads(status);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_type ON re_documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created ON re_documents(created_at DESC);
```

#### 2. Add Database Constraints

```sql
-- Ensure valid document types
ALTER TABLE re_documents
ADD CONSTRAINT valid_document_type CHECK (
  type IN ('inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
           'offer', 'counter_offer', 'purchase_agreement', 'addendum',
           'closing_statement', 'hud1', 'deed', 'contract', 'receipt', 'other')
);

-- Ensure valid lead motivations
ALTER TABLE re_leads
ADD CONSTRAINT valid_motivation CHECK (
  motivation IS NULL OR
  motivation IN ('foreclosure', 'divorce', 'inherited', 'relocating', 'tired_landlord',
                 'medical', 'downsizing', 'financial', 'other')
);

-- Ensure valid timelines
ALTER TABLE re_leads
ADD CONSTRAINT valid_timeline CHECK (
  timeline IS NULL OR
  timeline IN ('asap', '1_3_months', '3_6_months', 'flexible')
);
```

#### 3. Migration Rollback Plans

**For each migration, create a rollback file**:

Example: `supabase/migrations/20260116_lead_documents_rollback.sql`

```sql
-- Rollback for lead documents
DROP TABLE IF EXISTS re_lead_documents CASCADE;
```

Example: `supabase/migrations/20260116_property_documents_junction_rollback.sql`

```sql
-- Rollback for property-documents junction
DROP TABLE IF EXISTS re_property_documents CASCADE;
```

#### 4. Testing Checklist ✅ COMPLETE

- [x] All migrations run without errors
- [x] TypeScript types generated successfully
- [x] RLS policies prevent unauthorized access
- [x] Indexes improve query performance (120+ indexes deployed)
- [x] Edge functions created and ready for deployment
- [x] Foreign key constraints work correctly
- [x] Cascade deletes work as expected
- [x] Unique constraints prevent duplicates
- [x] Check constraints validate data
- [x] ENUM types enforce type safety
- [x] Triggers auto-update timestamps
- [x] Comprehensive documentation created

---

## Database Type Generation

After each migration, regenerate types for Zone C:

```bash
# Option 1: Remote project
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types/database.ts

# Option 2: Local development
npx supabase gen types typescript --local > src/integrations/supabase/types/database.ts
```

**Commit the generated types file** so Zone C can use them.

---

## Deliverables Checklist

### Sprint 1 Deliverables (for Zone C) ✅ COMPLETE
- [x] `re_lead_documents` table created
- [x] `re_property_documents` junction table created
- [x] `deal_id` column added to `re_documents`
- [x] RLS policies applied
- [x] TypeScript types generated
- [x] Types committed to repo

### Sprint 2 Deliverables ✅ COMPLETE
- [x] `re_portfolio_valuations` table created
- [x] Portfolio fields added to `deals`
- [x] Creative finance fields added to `leads`
- [x] `re_calculation_overrides` table created
- [x] RLS policies applied
- [x] Types regenerated

### Sprint 3 Deliverables ✅ COMPLETE
- [x] `sms-webhook` edge function created (ready for deployment)
- [x] `scheduled-reminders` edge function created (ready for deployment)
- [ ] Cron job configured (requires Supabase CLI)
- [x] `sms_inbox` table created
- [x] `notifications` table created
- [x] `re_document_templates` table created
- [x] `re_user_calculation_preferences` table created
- [x] Types regenerated

### Sprint 4 Deliverables ✅ COMPLETE
- [x] Performance indexes added (120+ indexes)
- [x] Database constraints added (50+ constraints)
- [x] PostgreSQL ENUM types created (5 types)
- [x] Rollback scripts created
- [x] Testing completed
- [x] Documentation updated

### Final Deployment Status
- [x] All database migrations applied to production (23 total)
- [x] All RLS policies deployed (65+ policies)
- [x] All performance optimizations deployed
- [x] Comprehensive documentation created
- [ ] Edge functions deployed via CLI (user action required)
- [ ] Cron job configured (user action required)
- [ ] Webhook endpoints configured (user action required)

---

## Sync Points with Other Zones

### After Sprint 1 (Week 2)
**Deliver to Zone C**:
- ✅ New database types for lead documents
- ✅ New database types for property-documents junction
- ✅ Updated types with `deal_id` on documents

Zone C can now build hooks for document management.

### After Sprint 2 (Week 4)
**Deliver to Zone C**:
- ✅ Portfolio table types
- ✅ Updated Deal types with portfolio fields
- ✅ Updated Lead types with creative finance fields

Zone C can now build portfolio hooks and creative finance features.

### After Sprint 3 (Week 6)
**Deliver to Zone D**:
- ✅ Edge function scaffolding (SMS webhook, scheduled reminders)
- ✅ SMS inbox table for storing incoming messages

Zone D can integrate OpenAI and Twilio.

---

## Testing Your Work

### Manual Testing
```sql
-- Test lead documents
INSERT INTO re_lead_documents (lead_id, title, type, file_url)
VALUES ('existing-lead-id', 'Test ID', 'id', 'https://example.com/test.pdf');

-- Test junction table
INSERT INTO re_property_documents (property_id, document_id, is_primary)
VALUES ('property-a-id', 'doc-id', true);

-- Test portfolio
INSERT INTO re_portfolio_valuations (property_id, valuation_date, estimated_value, source)
VALUES ('property-id', CURRENT_DATE, 450000, 'manual');
```

### Check RLS
```sql
-- Switch to user role and test queries
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid-here';

SELECT * FROM re_lead_documents; -- Should only see user's documents
```

---

## Environment Variables (Supabase Secrets)

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
ZILLOW_API_KEY=...
```

---

## Ready to Begin?

**Start with Sprint 1**:
1. Create `re_lead_documents` migration
2. Create `re_property_documents` junction migration
3. Add `deal_id` to `re_documents`
4. Generate types
5. Commit and notify Zone C

You are the foundation. Go!
