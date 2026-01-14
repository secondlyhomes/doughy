# AI Assistant System - Technical Guide

## Overview

The AI Assistant system provides context-aware AI assistance throughout the Deal OS platform. It's designed with optimization, caching, and extensibility in mind.

## Architecture

### Core Components

#### 1. **Assistant Context System** (`src/features/assistant/hooks/useAssistantContext.ts`)
Provides structured context snapshots to the AI based on current screen and user activity.

**Key Features:**
- Automatic screen detection and context building
- Screen-specific payload generators (DealCockpit, PropertyDetail, etc.)
- Context compression for token efficiency
- Real-time data integration from deals, properties, and events

**Usage:**
```typescript
const context = useAssistantContext();
// context contains: app, user, screen, permissions, selection, payload
```

#### 2. **Deal Assistant AI** (`src/lib/ai/dealAssistant.ts`)
Enhanced AI service with optimized prompts and response handling.

**Key Features:**
- Context-aware system prompts
- Token-efficient context compression
- Suggested actions extraction
- Confidence assessment
- Response caching (15-minute TTL)

**Usage:**
```typescript
const response = await callDealAssistant(
  'What should I focus on?',
  context,
  conversationHistory
);

console.log(response.content);
console.log(response.suggestedActions); // ['Get repair estimate', ...]
console.log(response.confidence); // 'high' | 'medium' | 'low'
```

#### 3. **Job Processors** (`src/lib/ai/jobProcessors.ts`)
Background job execution for long-running AI tasks.

**Supported Jobs:**
- `generate_seller_report` - Creates comprehensive seller options report
- `organize_walkthrough` - AI processes field mode photos and voice memos
- `extract_facts` - Pulls stated facts from conversations
- `generate_offer_packet` - Creates complete offer documents
- `prepare_esign_envelope` - Sets up DocuSign/SignNow envelopes

**Usage:**
```typescript
const result = await executeJob(job, context);

if (result.success) {
  console.log('Result:', result.result_json);
  console.log('Artifacts:', result.result_artifact_ids);
}
```

#### 4. **Response Cache** (`src/lib/ai/cache.ts`)
Two-tier caching system for AI responses.

**Features:**
- In-memory cache for fast lookups
- Persistent cache (AsyncStorage) for offline support
- Automatic expiration (15-minute TTL)
- Context-aware cache keys
- LRU eviction for memory management

**Cache Hit Scenarios:**
- Identical question on same screen
- Same deal context (stage, ID)
- Within 15-minute window

#### 5. **UI Components**

**DealAssistant** (`src/features/assistant/components/DealAssistant.tsx`)
- Floating draggable bubble
- 3-tab interface (Actions, Ask, Jobs)
- Real-time job monitoring
- Badge notifications

**ActionsTab** - Recommended actions based on deal stage and context
**AskTab** - Chat interface with contextual suggestions
**JobsTab** - Background job status with progress tracking

**PatchSetPreview** - Before/after preview for AI-proposed changes

## Optimization Techniques

### 1. Context Compression

Instead of sending entire deal objects, we compress to essentials:

```typescript
// Before (verbose):
{
  deal: { /* 50+ fields */ },
  property: { /* 30+ fields */ },
  lead: { /* 20+ fields */ }
}

// After (compressed):
"123 Main St | Analyzing | Next: Get repair estimate | MAO: $185k (high) | Missing (HIGH): Repairs"
```

**Token Savings:** ~70% reduction in context size

### 2. Response Caching

- **In-Memory Cache:** O(1) lookup, 50 entry limit
- **Persistent Cache:** Survives app restarts
- **Smart Invalidation:** Context hash detects when cache should invalidate

**Benefits:**
- Instant responses for repeated questions
- Reduced API costs
- Offline support

### 3. Confidence Assessment

AI responses include confidence levels based on data completeness:

```typescript
// High confidence: Complete data, no missing critical info
// Medium confidence: Some missing data
// Low confidence: Multiple high-priority items missing
```

This helps users understand when they need more data before making decisions.

### 4. Suggested Actions Extraction

AI responses are parsed for action-oriented phrases:

```typescript
// Input: "You should get a contractor estimate and verify ARV..."
// Output: suggestedActions: ['get a contractor estimate', 'verify ARV']
```

Users can click suggestions to execute actions directly.

## Testing

### Unit Tests

**AI Service Tests** (`src/lib/ai/__tests__/dealAssistant.test.ts`)
- Context compression validation
- Response formatting
- Confidence assessment
- Action extraction
- Draft generation

**Job Processor Tests** (`src/lib/ai/__tests__/jobProcessors.test.ts`)
- Each job type tested independently
- Progress tracking verification
- Error handling
- Result structure validation

**Existing Tests** (from your codebase)
- `useChat.test.ts` - Chat hook behavior
- `useApplyPatchSet.test.ts` - PatchSet application
- `catalog.test.ts` - Action catalog
- `handlers.test.ts` - Action handlers
- `patchset.test.ts` - PatchSet types

Run tests:
```bash
npm test -- ai
```

### Integration Testing

Test full assistant workflow:
1. Open deal → Context builds automatically
2. Ask question → AI receives compressed context
3. Review response → Suggested actions extracted
4. Execute action → PatchSet preview shown
5. Apply changes → Database updated, events logged

## Performance Metrics

### Response Times

- **Cache Hit:** <50ms (in-memory), <200ms (persistent)
- **Cache Miss (Mock):** 1-2 seconds
- **Cache Miss (Production):** 2-4 seconds (depends on OpenAI)

### Token Usage

Per request with full context:
- System Prompt: ~200 tokens
- Compressed Context: ~100 tokens
- User Message: ~20-50 tokens
- Response: ~150-250 tokens
- **Total:** ~470-600 tokens per interaction

Cost (GPT-4o-mini):
- ~$0.0003 per interaction
- With caching: ~$0.00006 per interaction (80% hit rate)

## Best Practices

### 1. When to Use Each Service

**callDealAssistant:**
- General questions about deals
- Analysis requests
- Recommendations
- Explanations

**generateActionRecommendation:**
- NBA (Next Best Action) suggestions
- Automated prompts
- Dashboard widgets

**draftCommunication:**
- Email templates
- SMS messages
- Offer text

### 2. Context Usage

Always provide context when available:
```typescript
// Good
const response = await callDealAssistant(message, context);

// Bad - generic response without deal context
const response = await callDealAssistant(message);
```

### 3. Job Processors

Use jobs for operations that take >3 seconds:
- Report generation (PDF creation)
- Bulk data processing
- AI analysis of large datasets

Don't use jobs for:
- Simple queries
- Real-time chat responses
- Quick calculations

### 4. Cache Management

Clear cache when:
- Deal stage changes significantly
- Critical data updated (ARV, repairs, etc.)
- User explicitly requests refresh

```typescript
import { clearCache } from '@/lib/ai/cache';

await clearCache(); // Nuclear option - clears everything
```

## Extending the System

### Adding New Screen Payloads

1. Add type to `context.ts`:
```typescript
export interface MyNewPayload {
  type: 'my_new_screen';
  // ... fields
}
```

2. Add builder function:
```typescript
function buildMyNewPayload(...): MyNewPayload {
  return { type: 'my_new_screen', ... };
}
```

3. Add to switch statement in `useAssistantContext.ts`

### Adding New Job Types

1. Add to `AIJobType` in `jobs.ts`
2. Create processor function in `jobProcessors.ts`
3. Add to `JOB_PROCESSORS` registry
4. Add job type config to `JOB_TYPE_CONFIG`

### Adding New Actions

1. Add to `ActionId` type in `catalog.ts`
2. Create `ActionDefinition` in `ACTION_CATALOG`
3. Implement handler in `handlers/index.ts`
4. Add icon mapping in `ActionsTab.tsx`

## Troubleshooting

### Cache Not Working

Check:
1. AsyncStorage permissions
2. Cache key generation (context hash)
3. Expiration time (default 15 min)

Debug:
```typescript
import { getCacheStats } from '@/lib/ai/cache';
console.log(getCacheStats());
```

### AI Responses Are Generic

Check:
1. Context is being passed to `callDealAssistant`
2. Context payload has correct data
3. Context compression includes key fields

Debug:
```typescript
const context = useAssistantContext();
console.log('Payload type:', context.payload.type);
console.log('Selection:', context.selection);
```

### Jobs Not Processing

Check:
1. Job status in database
2. Background worker running
3. Job processor exists for job type

Debug:
```typescript
const { jobs } = useAIJobs(dealId);
console.log('Pending jobs:', jobs.filter(j => j.status === 'queued'));
```

## Future Enhancements

### Planned Features

1. **Streaming Responses** - Real-time AI output as it's generated
2. **Multi-Modal Input** - Image and voice input support
3. **Conversation Memory** - Long-term memory across sessions
4. **Custom Models** - Fine-tuned models for specific workflows
5. **Offline Mode** - Enhanced offline capabilities with cached responses
6. **Voice Output** - TTS for hands-free operation (Field Mode)
7. **Proactive Suggestions** - AI suggests actions before being asked

### Performance Optimizations

1. **Prompt Caching** - Cache system prompts at OpenAI level
2. **Batch Processing** - Group related queries
3. **Edge Functions** - Move AI closer to users geographically
4. **Model Selection** - Automatically choose between GPT-4o-mini and GPT-4 based on complexity

## Support

For questions or issues:
- Check existing tests for usage examples
- Review mock implementations for expected behavior
- See `PHASE_2_PARALLEL_DEV_PLAN.md` for roadmap

## Version History

- **v1.0** - Initial implementation with basic AI chat
- **v2.0** - Added context system and PatchSets
- **v3.0** - Added job processors and caching (current)
- **v3.1** - Added comprehensive tests and optimization
