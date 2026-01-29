# Landlord Seeder Troubleshooting Guide

This document covers common errors encountered when running the landlord seeder (`seedFullPropertyManager`) and their solutions.

## Common Errors and Fixes

### 1. Invalid Enum Values

**Error Pattern:**
```
Failed to create [table]: invalid input value for enum [enum_name]
```

**Common Issues:**

| Table | Field | Invalid Value | Valid Values |
|-------|-------|---------------|--------------|
| `crm_contacts` | `source` | `'vrbo'` (before migration) | `furnishedfinder`, `airbnb`, `vrbo`, `turbotenant`, `zillow`, `facebook`, `whatsapp`, `direct`, `referral`, `craigslist`, `other` |
| `property_maintenance` | `status` | - | `reported`, `scheduled`, `in_progress`, `completed`, `cancelled` |
| `property_maintenance` | `priority` | - | `emergency`, `high`, `medium`, `low` |
| `property_maintenance` | `category` | - | `plumbing`, `electrical`, `hvac`, `appliance`, `structural`, `pest_control`, `landscaping`, `cleaning`, `general`, `other` |
| `property_maintenance` | `charge_to` | - | `owner`, `guest`, `warranty`, `insurance` |
| `booking_charges` | `charge_type` | - | `damage`, `cleaning`, `missing_item`, `late_checkout`, `rule_violation`, `utility_overage`, `other` |
| `booking_charges` | `status` | - | `pending`, `approved`, `disputed`, `deducted`, `waived`, `paid` |
| `property_turnovers` | `status` | - | `pending`, `checkout_complete`, `cleaning_scheduled`, `cleaning_done`, `inspected`, `ready`, `cancelled` |
| `guest_message_templates` | `template_type` | - | `check_in_instructions`, `checkout_reminder`, `house_rules`, `review_request`, `welcome`, `pre_arrival`, `during_stay`, `emergency_contact`, `custom` |

**Solution:** Check `src/types/supabase.ts` for valid enum values under the `Enums` section.

---

### 2. Wrong Column Names

**Error Pattern:**
```
Failed to create [table]: column "[column]" of relation "[table]" does not exist
```

**Common Mismatches:**

| Table | Wrong Name | Correct Name |
|-------|------------|--------------|
| `property_maintenance` | `scheduled_date` | `scheduled_at` |
| `property_maintenance` | `completed_date` | `completed_at` |
| `booking_charges` | `type` | `charge_type` |
| `property_turnovers` | `booking_id` | `checkout_booking_id` or `checkin_booking_id` |
| `guest_message_templates` | `type` | `template_type` |

**Solution:** Check the `Insert` type definition in `src/types/supabase.ts` for the correct column names.

---

### 3. Missing Required Fields

**Error Pattern:**
```
Failed to create [table]: null value in column "[column]" violates not-null constraint
```

**Common Missing Fields:**

| Table | Required Field | Description |
|-------|----------------|-------------|
| `guest_message_templates` | `name` | Template display name |
| `guest_message_templates` | `template_type` | Enum type of template |
| `guest_message_templates` | `body` | Template content |
| `property_maintenance` | `title` | Work order title |
| `property_maintenance` | `user_id` | Owner user ID |
| `property_maintenance` | `property_id` | Associated property |
| `booking_charges` | `description` | Charge description |
| `booking_charges` | `amount` | Charge amount |

**Solution:** Check the `Insert` type in `src/types/supabase.ts` - fields without `?` are required.

---

### 4. Foreign Key Violations

**Error Pattern:**
```
Failed to create [table]: insert or update on table "[table]" violates foreign key constraint
```

**Common Causes:**
- Referencing a record that doesn't exist yet
- Using wrong ID from a previous insert
- Tables must be created in dependency order

**Seeder Insert Order:**
1. `rental_properties` - No dependencies
2. `property_vendors` - References `rental_properties` (optional)
3. `crm_contacts` - No dependencies
4. `rental_bookings` - References `rental_properties`, `crm_contacts`
5. `property_inventory` - References `rental_properties`
6. `property_maintenance` - References `rental_properties`, `rental_bookings`, `property_inventory`, `property_vendors`
7. `booking_charges` - References `rental_bookings`, `property_maintenance`
8. `deposit_settlements` - References `rental_bookings`
9. `property_turnovers` - References `rental_properties`, `rental_bookings`, `property_vendors`, `property_maintenance`
10. `guest_message_templates` - References `rental_properties` (optional)
11. `rental_conversations` - References `crm_contacts`, `rental_properties`
12. `rental_messages` - References `rental_conversations`

---

### 5. Database Schema Out of Sync

**Error Pattern:**
```
Failed to create [table]: relation "[table]" does not exist
```

**Solution:**
1. Check if migrations have been applied:
   ```bash
   npx supabase db push --local
   ```
   Or use the Supabase MCP to apply migrations to remote.

2. Regenerate TypeScript types:
   ```bash
   npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/supabase.ts
   ```

---

## Adding New Enum Values

If you need to add a new enum value (like `vrbo` for `crm_contact_source`):

1. **Create a migration file:**
   ```sql
   -- supabase/migrations/YYYYMMDDHHMMSS_add_new_enum_value.sql
   ALTER TYPE enum_name ADD VALUE IF NOT EXISTS 'new_value' AFTER 'existing_value';
   ```

2. **Apply the migration:**
   - Local: `npx supabase db push --local`
   - Remote: Use Supabase MCP `apply_migration` tool

3. **Regenerate types:**
   ```bash
   npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/supabase.ts
   ```

---

## Debugging Tips

1. **Check the actual error message** - The seeder logs truncate messages. Check the full console output.

2. **Validate against types** - Before inserting, compare your data against the `Insert` type in `supabase.ts`.

3. **Test individual inserts** - Comment out sections to isolate which insert is failing.

4. **Check enum values** - Search for the enum name in `supabase.ts`:
   ```typescript
   // Find valid values
   grep "enum_name:" src/types/supabase.ts -A 10
   ```

5. **Verify table schema** - Use Supabase dashboard or:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'table_name';
   ```

---

## Related Files

- Seeder: `src/features/settings/services/landlordSeeder.ts`
- Types: `src/types/supabase.ts`
- Migrations: `supabase/migrations/`
- Dev UI: `src/features/settings/components/DevSeederSection.tsx`
