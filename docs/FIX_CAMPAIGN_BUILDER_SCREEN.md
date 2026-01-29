# Fix: CampaignBuilderScreen Metro Bundler Hang

**Created**: 2026-01-29
**Status**: Deferred
**Priority**: Medium
**Affects**: Campaign creation, postcard/direct mail campaigns

## Problem Summary

The `CampaignBuilderScreen.tsx` was causing Metro bundler to hang at 99.9% during bundling, preventing the entire app from loading. The screen was stubbed out to unblock development.

## Current State

- **Working stub**: `src/features/campaigns/screens/CampaignBuilderScreen.tsx` - Shows placeholder text
- **Full backup**: `src/features/campaigns/screens/CampaignBuilderScreen.tsx.bak` - Contains complete implementation

## Impact

Without this screen, users cannot:
- Create new drip campaigns via UI
- Configure direct mail/postcard campaigns
- Select postcard types (4x6, 6x9, 6x11, yellow letter, letters)

## Root Cause Analysis

- The stub and backup have **identical imports** - imports are NOT the problem
- Issue is somewhere in the 600+ lines of component body code
- Likely a specific code pattern or NativeWind class combination that confuses babel/metro transformer
- Cache clearing was attempted and did not resolve the issue

## Backend Status

The backend infrastructure is fully implemented and working:
- `supabase/functions/direct-mail-sender/index.ts` - PostGrid API integration
- `supabase/functions/drip-touch-executor/index.ts` - Handles direct_mail channel
- `moltbot-server/src/channels/postgrid.ts` - PostGrid adapter
- `src/features/campaigns/types/index.ts` - Types including `MailPieceType` and `MAIL_PIECE_CONFIG`

## Fix Plan

Rebuild the component incrementally in phases, testing Metro bundling after each phase:

### Phase 1: Basic Wizard Structure
1. Create the basic 3-step wizard shell (no inputs, just navigation)
2. Test Metro bundling

### Phase 2: Add Step 1 (Campaign Basics)
1. Add campaign name input
2. Add lead type select with `LEAD_TYPE_CONFIG`
3. Add motivation level select
4. Add quiet hours inputs and weekend toggle
5. Test Metro bundling

### Phase 3: Add StepEditor Component
1. Create `StepEditor` as a separate component
2. Add channel selection
3. Add channel-specific fields including **direct mail postcard selector**
4. Test Metro bundling

### Phase 4: Add Step 3 (Review)
1. Add campaign summary display
2. Add steps preview
3. Test Metro bundling

### Phase 5: Add Save Logic
1. Wire up `useCreateCampaign`, `useCreateCampaignStep`, `useUpdateCampaign`
2. Add save/activate handlers
3. Test Metro bundling

## Key Features to Include

- 3-step wizard (Basics -> Configure Steps -> Review & Launch)
- **Direct Mail channel with postcard type selector**:
  - Postcard 4x6 ($1.49)
  - Postcard 6x9 ($1.99)
  - Postcard 6x11 ($2.49)
  - Yellow Letter ($2.99)
  - Letter 1-page ($2.49)
  - Letter 2-page ($3.49)
- Lead type selection with default cadence generation
- Campaign save and activation

## Reference: Backup File Postcard Code (lines 186-207)

```tsx
{step.channel === 'direct_mail' && (
  <>
    <Select
      label="Mail Piece Type"
      value={step.mail_piece_type || 'postcard_4x6'}
      onValueChange={(val) => onUpdate({ mail_piece_type: val as MailPieceType })}
      options={Object.entries(MAIL_PIECE_CONFIG).map(([key, config]) => ({
        label: `${config.label} ($${config.price.toFixed(2)})`,
        value: key,
      }))}
      className="mb-2"
    />
    <Input
      label="Message"
      value={step.message_body || ''}
      onChangeText={(text) => onUpdate({ message_body: text })}
      placeholder="We'd like to make you a cash offer on your property at {property_address}..."
      multiline
      numberOfLines={4}
      style={{ minHeight: 100, textAlignVertical: 'top' }}
    />
  </>
)}
```

## Verification Checklist

- [ ] Metro bundling completes (100%)
- [ ] Navigate to campaigns/new route
- [ ] 3-step wizard appears
- [ ] Can create campaign with direct mail step
- [ ] Postcard type selector shows all options with prices
- [ ] Campaign saves successfully
- [ ] Campaign activates successfully

## Files to Modify

- `src/features/campaigns/screens/CampaignBuilderScreen.tsx`

## Files to Delete (after fix)

- `src/features/campaigns/screens/CampaignBuilderScreen.tsx.bak`
