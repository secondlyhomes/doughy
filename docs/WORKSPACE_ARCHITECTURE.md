# Workspace Architecture - Team Collaboration

**Last Updated**: 2026-01-30
**Lead DBA**: Claude (Opus 4.5)
**Status**: Implemented

---

## Overview

Doughy supports team collaboration through a unified workspace model. A workspace is a container that enables multiple users to share and collaborate on data across both the Investor and Landlord platforms.

```
┌─────────────────────────────────────────────────────────────┐
│                      WORKSPACE                               │
│                   (One team = One workspace_id)              │
├─────────────────────────────┬───────────────────────────────┤
│   INVESTOR PLATFORM         │   LANDLORD PLATFORM           │
│   (if team uses it)         │   (if team uses it)           │
├─────────────────────────────┼───────────────────────────────┤
│ • investor_properties       │ • landlord_properties         │
│ • investor_deals_pipeline   │ • landlord_bookings           │
│ • investor_campaigns        │ • landlord_conversations      │
│ • crm_leads                 │ • landlord_maintenance        │
│ • investor_conversations    │ • landlord_vendors            │
└─────────────────────────────┴───────────────────────────────┘
```

**Key Concept**: Teams can use one platform, the other, or both - all with the same `workspace_id`.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sharing Model | All properties shared | Team members see all workspace data |
| Role System | Simple (Owner + Member) | Owner has full control, members read/write |
| Platform Scope | Unified workspace | One workspace_id across both platforms |

---

## Database Schema

### Core Tables

```sql
-- Workspaces (already exists)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  description TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Workspace Members (already exists)
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' or 'member'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

### Tables with workspace_id

**Landlord Platform (15 tables):**
- landlord_properties
- landlord_rooms
- landlord_bookings
- landlord_conversations
- landlord_messages
- landlord_ai_queue_items
- landlord_inventory_items
- landlord_maintenance_records
- landlord_vendors
- landlord_vendor_messages
- landlord_turnovers
- landlord_booking_charges
- landlord_deposit_settlements
- landlord_guest_templates
- landlord_turnover_templates

**Investor Platform (24 tables):**
- investor_properties
- investor_comps
- investor_property_analyses
- investor_property_debts
- investor_property_documents
- investor_property_images
- investor_property_mortgages
- investor_financing_scenarios
- investor_repair_estimates
- investor_lead_properties
- investor_deals_pipeline
- investor_deal_events
- investor_campaigns
- investor_drip_campaign_steps
- investor_drip_enrollments
- investor_agents
- investor_follow_ups
- investor_outreach_templates
- investor_conversations
- investor_messages
- crm_leads
- comms_conversation_items
- user_profiles

**Shared/CRM (3 tables):**
- crm_contacts
- comms_call_logs
- comms_call_transcripts

---

## RLS Security Model

### Helper Functions

```sql
-- Get all workspaces user has access to
CREATE FUNCTION user_workspace_ids() RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

-- Get workspaces where user is owner (for delete operations)
CREATE FUNCTION user_owned_workspace_ids() RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true AND role = 'owner';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;
```

### Policy Pattern

```sql
-- SELECT: All workspace members can view
CREATE POLICY "table_workspace_select" ON table_name
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

-- INSERT: All workspace members can create
CREATE POLICY "table_workspace_insert" ON table_name
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- UPDATE: All workspace members can update
CREATE POLICY "table_workspace_update" ON table_name
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

-- DELETE: Only workspace owners can delete
CREATE POLICY "table_workspace_delete" ON table_name
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));
```

---

## Role Permissions Matrix

| Action | Owner | Member |
|--------|:-----:|:------:|
| View all workspace data | ✓ | ✓ |
| Create records | ✓ | ✓ |
| Edit records | ✓ | ✓ |
| Delete records | ✓ | ✗ |
| Invite members | ✓ | ✗ |
| Remove members | ✓ | ✗ |
| Transfer ownership | ✓ | ✗ |
| Delete workspace | ✓ | ✗ |

---

## Auto-Creation Trigger

Every new user automatically gets a default workspace:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create default workspace
  INSERT INTO workspaces (name, owner_id, created_by)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace'), NEW.id, NEW.id)
  RETURNING id INTO new_workspace_id;

  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## workspace_id Auto-Set Triggers

### For tables with user_id column:

```sql
CREATE FUNCTION set_workspace_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT wm.workspace_id INTO NEW.workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = COALESCE(NEW.user_id, auth.uid())
      AND wm.is_active = true
    ORDER BY wm.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### For child tables (inherit from parent):

```sql
-- landlord_rooms inherits from landlord_properties
CREATE FUNCTION set_workspace_id_from_landlord_property()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord_properties WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- landlord_messages inherits from landlord_conversations
CREATE FUNCTION set_workspace_id_from_landlord_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord_conversations WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Index Strategy

### Required Indexes

Every table with `workspace_id` MUST have:

```sql
-- Basic workspace index (for RLS performance)
CREATE INDEX idx_table_workspace_id ON table_name(workspace_id);
```

### Recommended Composite Indexes

```sql
-- Common query patterns
CREATE INDEX idx_landlord_properties_workspace_status
  ON landlord_properties(workspace_id, status);

CREATE INDEX idx_landlord_bookings_workspace_dates
  ON landlord_bookings(workspace_id, start_date, end_date);

CREATE INDEX idx_investor_deals_pipeline_workspace_stage
  ON investor_deals_pipeline(workspace_id, stage);
```

---

## TypeScript Integration

### Store Pattern

```typescript
// Zustand store with workspace awareness
export const useRentalPropertiesStore = create<RentalPropertiesStore>((set, get) => ({
  properties: [],

  fetchProperties: async () => {
    // workspace_id filter is handled by RLS - no explicit filter needed
    const { data, error } = await supabase
      .from('landlord_properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    set({ properties: data });
  },

  createProperty: async (property) => {
    // workspace_id is auto-set by trigger - no explicit value needed
    const { data, error } = await supabase
      .from('landlord_properties')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}));
```

### Context Provider (for workspace switching)

```typescript
interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  isLoading: boolean;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Load workspaces for current user
  useEffect(() => {
    const loadWorkspaces = async () => {
      const { data } = await supabase
        .from('workspace_members')
        .select('workspace:workspaces(*)')
        .eq('is_active', true);

      setWorkspaces(data?.map(d => d.workspace) ?? []);
      setCurrentWorkspace(data?.[0]?.workspace ?? null);
    };
    loadWorkspaces();
  }, []);

  const switchWorkspace = async (workspaceId: string) => {
    // Switching workspaces - all queries will now return different data
    // because RLS filters by the active workspace
    setCurrentWorkspace(workspaces.find(w => w.id === workspaceId) ?? null);
  };

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, switchWorkspace, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
```

---

## Verification Queries

### Check workspace_id coverage:

```sql
-- Tables that should have workspace_id
SELECT table_name,
  CASE WHEN column_name IS NOT NULL THEN '✓' ELSE '✗' END as has_workspace_id
FROM (
  SELECT DISTINCT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'landlord_%'
) t
LEFT JOIN information_schema.columns c
  ON c.table_name = t.table_name
  AND c.column_name = 'workspace_id'
  AND c.table_schema = 'public'
ORDER BY table_name;
```

### Check for NULL workspace_ids:

```sql
-- Find records missing workspace_id
SELECT 'landlord_properties' as tbl, COUNT(*) as null_count
FROM landlord_properties WHERE workspace_id IS NULL
UNION ALL
SELECT 'landlord_bookings', COUNT(*)
FROM landlord_bookings WHERE workspace_id IS NULL
UNION ALL
SELECT 'landlord_conversations', COUNT(*)
FROM landlord_conversations WHERE workspace_id IS NULL;
```

### Test RLS isolation:

```sql
-- As User A in Workspace W1, create a property
INSERT INTO landlord_properties (name, ...) VALUES ('Test Property');

-- As User B in Workspace W1, should see the property
SELECT * FROM landlord_properties; -- Returns 'Test Property'

-- As User C in Workspace W2, should NOT see the property
SELECT * FROM landlord_properties; -- Returns empty
```

---

## Migration History

| Migration | Purpose |
|-----------|---------|
| `20260130700000_add_workspace_to_landlord_tables.sql` | Add workspace_id to 15 landlord tables |
| `20260130700001_add_workspace_to_investor_tables.sql` | Add workspace_id to 10 investor tables |
| `20260130700002_add_workspace_to_shared_tables.sql` | Add workspace_id to 3 shared tables |
| `20260130700003_backfill_workspace_ids.sql` | Populate workspace_id for existing data |
| `20260130700004_create_workspace_triggers.sql` | Auto-set triggers for workspace_id |
| `20260130700005_update_workspace_rls_policies.sql` | Update RLS to use workspace membership |

---

## Related Documentation

- [DATABASE_NAMING_CONVENTIONS.md](./DATABASE_NAMING_CONVENTIONS.md) - Multi-tenancy column patterns
- [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) - Row Level Security overview
- [DATABASE_AUDIT_2026-01-29.md](./DATABASE_AUDIT_2026-01-29.md) - Table audit with workspace_id status
