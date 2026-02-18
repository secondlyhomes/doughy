# AI Integration Examples

Complete AI integration examples for React Native + Expo + Supabase applications.

## Overview

This directory contains production-ready AI integration patterns including:

- **Chat Interface** - Full-featured chat with streaming responses
- **RAG (Retrieval-Augmented Generation)** - Semantic search with context-aware AI responses
- **Vector Store** - Supabase pgvector integration for embeddings
- **Cost Tracking** - Monitor and optimize AI API costs
- **Rate Limiting** - Prevent abuse and manage budgets

## Quick Start

### 1. Set Up Database

```bash
# Run the database schema
cd database
psql "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres" < schema.sql
```

See [database/MIGRATIONS.md](./database/MIGRATIONS.md) for detailed setup instructions.

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 3. Set Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Edge Function environment variables (set in Supabase Dashboard)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
```

### 4. Use in Your App

```tsx
import { AIProvider } from '@/features/ai-integration/AIContext'
import { ChatInterface } from '@/features/ai-integration/components/ChatInterface'

export default function App() {
  return (
    <AIProvider defaultModel="gpt-4o-mini">
      <ChatInterface systemPrompt="You are a helpful assistant." />
    </AIProvider>
  )
}
```

## File Structure

```
ai-integration/
├── AIContext.tsx              # Main AI context with chat, streaming, cost tracking
├── aiService.ts               # Client-side AI service functions
├── components/
│   ├── ChatInterface.tsx      # Complete chat UI
│   ├── AIAssistant.tsx        # Floating AI assistant
│   └── SmartSearch.tsx        # Semantic search interface
├── rag/
│   ├── vectorStore.ts         # Supabase pgvector operations
│   ├── embeddings.ts          # Generate and store embeddings
│   ├── similarity.ts          # Similarity search utilities
│   └── RAGContext.tsx         # RAG context provider
├── database/
│   ├── schema.sql             # Complete database schema
│   └── MIGRATIONS.md          # Migration guide
└── README.md                  # This file
```

## Features

### 1. Chat Interface

Full-featured chat with multiple models and streaming support.

```tsx
import { ChatInterface } from '@/features/ai-integration/components/ChatInterface'

function ChatScreen() {
  return (
    <ChatInterface
      systemPrompt="You are a coding assistant."
      enableStreaming={true}
      showCost={true}
      showModelSelector={true}
    />
  )
}
```

**Features:**
- Multiple AI models (OpenAI, Anthropic)
- Streaming responses with real-time display
- Cost tracking per message and conversation
- Model selector UI
- Auto-scroll and loading states

### 2. AI Assistant (Floating)

Floating assistant that can be triggered from anywhere in your app.

```tsx
import { AIAssistant } from '@/features/ai-integration/components/AIAssistant'

function App() {
  return (
    <>
      {/* Your app content */}
      <AIAssistant
        position="bottom-right"
        quickActions={[
          { id: 'summarize', label: 'Summarize', prompt: 'Summarize:' },
          { id: 'explain', label: 'Explain', prompt: 'Explain:' },
        ]}
      />
    </>
  )
}
```

**Features:**
- Floating button with customizable position
- Quick action buttons
- Modal interface
- Context-aware responses

### 3. Semantic Search (RAG)

Smart search with semantic understanding and AI-powered answers.

```tsx
import { RAGProvider } from '@/features/ai-integration/rag/RAGContext'
import { SmartSearch } from '@/features/ai-integration/components/SmartSearch'

function SearchScreen() {
  return (
    <RAGProvider>
      <SmartSearch
        placeholder="Search documentation..."
        enableHybrid={true}
        enableChat={true}
        metadataFilter={{ category: 'docs' }}
      />
    </RAGProvider>
  )
}
```

**Features:**
- Semantic search with embeddings
- Hybrid search (semantic + keyword)
- Chat with retrieved context
- Source citations
- Metadata filtering

### 4. RAG (Retrieval-Augmented Generation)

Ingest documents and query with AI context.

```tsx
import { useRAG } from '@/features/ai-integration/rag/RAGContext'

function DocumentManager() {
  const { ingestDocument, chatWithContext } = useRAG()

  const handleIngest = async (text: string) => {
    const result = await ingestDocument({
      content: text,
      metadata: { category: 'docs', author: 'Alice' },
    })
    console.log(`Ingested as ${result.id}, cost: $${result.cost}`)
  }

  const handleQuestion = async (question: string) => {
    const response = await chatWithContext({
      query: question,
      maxContextDocs: 3,
    })
    console.log(response.content)
    console.log(`Sources: ${response.sources.length}`)
  }

  return (
    // Your UI
  )
}
```

**Features:**
- Document ingestion with automatic chunking
- Semantic search with pgvector
- Context-aware chat responses
- Source citations with similarity scores
- Cost tracking

## OpenAI vs Anthropic Comparison

### Model Comparison

| Model | Provider | Speed | Quality | Cost (1M tokens) | Best For |
|-------|----------|-------|---------|------------------|----------|
| gpt-4o-mini | OpenAI | Fast | Good | $0.15/$0.60 | General tasks, high volume |
| gpt-4o | OpenAI | Medium | Excellent | $2.50/$10.00 | Complex reasoning |
| gpt-4-turbo | OpenAI | Slow | Best | $10.00/$30.00 | Highest quality needs |
| claude-3-haiku | Anthropic | Fast | Good | $0.25/$1.25 | Simple tasks |
| claude-3.5-sonnet | Anthropic | Medium | Excellent | $3.00/$15.00 | Coding, analysis |

### When to Use Each

**OpenAI (GPT-4o-mini)**
- High volume of simple requests
- Need lowest cost
- JSON output with function calling
- Embeddings generation

**OpenAI (GPT-4o)**
- Balanced performance and cost
- Most common use case
- Good for production

**Anthropic (Claude 3.5 Sonnet)**
- Code generation and review
- Long context needs (200k tokens)
- Detailed analysis
- Best reasoning quality

### Implementation

```tsx
import { useAI } from '@/features/ai-integration/AIContext'

function ModelSelector() {
  const { model, setModel } = useAI()

  return (
    <select value={model} onChange={(e) => setModel(e.target.value)}>
      <option value="gpt-4o-mini">GPT-4o Mini (Cheapest)</option>
      <option value="gpt-4o">GPT-4o (Balanced)</option>
      <option value="gpt-4-turbo">GPT-4 Turbo (Best)</option>
      <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
      <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Quality)</option>
    </select>
  )
}
```

## Cost Optimization Strategies

### 1. 3-Tier Model Routing

Route requests to the cheapest model that can handle them:

```typescript
import { aiService } from '@/features/ai-integration/aiService'

function selectModel(input: string) {
  const wordCount = input.trim().split(/\s+/).length
  const isComplex = /except|unless|only if/i.test(input)

  if (wordCount < 20 && !isComplex) return 'gpt-4o-mini'  // Simple
  if (wordCount < 75 && !isComplex) return 'gpt-4o-mini'  // Medium
  return 'gpt-4o'  // Complex
}
```

**Expected savings: 20-40%**

### 2. Response Caching

Cache identical or similar requests:

```typescript
// Automatically cached in aiService for 5 minutes
const response = await chatCompletion({
  messages: [{ role: 'user', content: 'What is React Native?' }],
})
```

**Expected savings: 10-20%**

### 3. Input/Output Caps

Prevent runaway costs with hard limits:

```typescript
const response = await chatCompletion({
  messages,
  maxTokens: 400,  // Cap output length
})
```

**Expected savings: 5-10%**

### 4. High-Confidence Skip

Skip AI when local matching is confident:

```typescript
const localMatch = localSearch(query)
if (localMatch.confidence > 0.9) {
  return localMatch  // Skip expensive AI call
}
```

**Expected savings: 10-30%**

### 5. Batch Operations

Batch embeddings generation:

```typescript
import { generateEmbeddingsBatch } from '@/features/ai-integration/rag/embeddings'

const embeddings = await generateEmbeddingsBatch({
  texts: ['Doc 1', 'Doc 2', 'Doc 3'],
})
```

**Expected savings: Faster processing**

### Combined Strategy

Implementing all strategies can reduce costs by **50-70%**.

## RAG Implementation Guide

### Step 1: Ingest Documents

```typescript
import { useRAG } from '@/features/ai-integration/rag/RAGContext'

const { ingestLongDocument } = useRAG()

// Ingest a long document with automatic chunking
const result = await ingestLongDocument({
  content: longText,
  chunkSize: 1000,
  metadata: {
    documentId: 'doc-123',
    category: 'tech',
    author: 'Alice',
  },
})

console.log(`Created ${result.chunks.length} chunks`)
console.log(`Cost: $${result.cost}`)
```

### Step 2: Semantic Search

```typescript
const { search } = useRAG()

const results = await search({
  query: 'How do I authenticate users?',
  limit: 5,
  threshold: 0.7,
  metadata: { category: 'tech' },
  useHybrid: true,  // Semantic + keyword
})

results.results.forEach(result => {
  console.log(`${result.content} (${result.similarity})`)
})
```

### Step 3: Chat with Context

```typescript
const { chatWithContext } = useRAG()

const response = await chatWithContext({
  query: 'How do I implement authentication?',
  model: 'gpt-4o',
  maxContextDocs: 3,
})

console.log(response.content)
console.log(`Sources used: ${response.sources.length}`)
console.log(`Total cost: $${response.totalCost}`)
```

### Advanced: Markdown Documents

```typescript
import { embedMarkdown } from '@/features/ai-integration/rag/embeddings'

const result = await embedMarkdown({
  markdown: `
## Introduction
This is a guide...

## Getting Started
First, install...

## Advanced Usage
For advanced features...
  `,
  metadata: { documentId: 'guide-1' },
})

console.log(`Created ${result.sections.length} sections`)
```

## Streaming Setup

### Client-Side Streaming

```typescript
import { streamCompletion } from '@/features/ai-integration/aiService'

const [response, setResponse] = useState('')

await streamCompletion({
  messages: [{ role: 'user', content: 'Write a story...' }],
  model: 'gpt-4o',
  onChunk: (chunk) => {
    if (!chunk.done) {
      setResponse(prev => prev + chunk.delta)
    }
  },
})
```

### Context-Based Streaming

```typescript
import { useAI } from '@/features/ai-integration/AIContext'

const { sendMessageStream } = useAI()

await sendMessageStream('Hello', (chunk) => {
  if (!chunk.done) {
    console.log(chunk.delta)  // Each word as it arrives
  }
})
```

## Context Management

### Conversation History

```typescript
import { useAI } from '@/features/ai-integration/AIContext'

const { conversation, createConversation } = useAI()

// Create new conversation
await createConversation('Customer Support', 'You are a helpful support agent.')

// Access messages
console.log(conversation.messages)
console.log(`Total cost: $${conversation.totalCost}`)
console.log(`Total tokens: ${conversation.totalTokens}`)
```

### Message Limits

Limit conversation history to prevent context overflow:

```typescript
const recentMessages = conversation.messages.slice(-10)  // Last 10 messages

const response = await chatCompletion({
  messages: [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  ],
})
```

## Safety and Moderation

### Content Moderation

```typescript
import { moderateContent, isContentSafe } from '@/features/ai-integration/aiService'

// Check if content is safe
const isSafe = await isContentSafe(userInput)

if (!isSafe) {
  alert('Content flagged by moderation')
  return
}

// Detailed moderation
const result = await moderateContent({ text: userInput })

if (result.flagged) {
  console.log('Flagged categories:', result.categories)
  console.log('Scores:', result.categoryScores)
}
```

### Jailbreak Detection

Edge Functions should include jailbreak detection:

```typescript
// In your Edge Function
const JAILBREAK_PATTERNS = [
  /ignore.*previous.*instructions/i,
  /you are now/i,
  /pretend you/i,
  /system.*prompt/i,
]

function detectJailbreak(input: string): boolean {
  return JAILBREAK_PATTERNS.some(pattern => pattern.test(input))
}

if (detectJailbreak(userInput)) {
  return new Response(
    JSON.stringify({ error: 'Invalid input' }),
    { status: 400 }
  )
}
```

### Input Validation

```typescript
const MAX_INPUT_LENGTH = 6000

if (input.length > MAX_INPUT_LENGTH) {
  throw new Error('Input too long')
}

// Sanitize input
const sanitized = input
  .slice(0, MAX_INPUT_LENGTH)
  .replace(/<\|.*?\|>/g, '')  // Remove special tokens
  .trim()
```

## Budget Controls

### Per-User Rate Limiting

Set up in Edge Functions with Upstash Redis:

```typescript
// supabase/functions/_shared/rateLimiter.ts
const LIMITS = {
  PER_MINUTE: 10,
  PER_DAY: 300,
}

const { allowed, remaining } = await checkRateLimit(userId)

if (!allowed) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    { status: 429 }
  )
}
```

### Usage Tracking

Track costs in real-time:

```typescript
// Automatically tracked in database
const usage = await supabase
  .from('ai_usage')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startOfMonth)

const totalCost = usage.reduce((sum, row) => sum + row.cost, 0)
console.log(`Monthly cost: $${totalCost}`)
```

### Budget Alerts

```typescript
const DAILY_BUDGET = 0.50  // $0.50 per user per day

async function checkBudget(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('ai_usage')
    .select('cost')
    .eq('user_id', userId)
    .gte('created_at', startOfDay)

  const todayCost = data.reduce((sum, row) => sum + row.cost, 0)

  if (todayCost > DAILY_BUDGET) {
    await sendAlertToAdmin(userId, todayCost)
    return false  // Block further requests
  }

  return true
}
```

## Testing

### Unit Tests

```typescript
import { calculateCost, estimateTokens } from '@/features/ai-integration/aiService'

describe('aiService', () => {
  it('calculates cost correctly', () => {
    const cost = calculateCost('gpt-4o-mini', 1000, 500)
    expect(cost).toBeCloseTo(0.00045, 6)
  })

  it('estimates tokens', () => {
    const tokens = estimateTokens('This is a test')
    expect(tokens).toBeGreaterThan(0)
  })
})
```

### Integration Tests

```typescript
import { semanticSearch } from '@/features/ai-integration/rag/similarity'

describe('RAG', () => {
  it('performs semantic search', async () => {
    const results = await semanticSearch({
      query: 'authentication',
      limit: 5,
    })

    expect(results.length).toBeLessThanOrEqual(5)
    expect(results[0].similarity).toBeGreaterThan(0.5)
  })
})
```

## Edge Functions

You'll need to create Edge Functions for:

1. **ai-chat** - Standard chat completion
2. **ai-chat-stream** - Streaming chat completion
3. **ai-embedding** - Generate single embedding
4. **ai-embedding-batch** - Generate multiple embeddings
5. **ai-moderate** - Content moderation
6. **ai-usage** - Get usage statistics

See `docs/07-ai-integration/` and `docs/patterns/AI-API-CALL.md` for Edge Function implementations.

## Troubleshooting

### Vector Search Not Working

```bash
# Ensure pgvector is enabled
psql> CREATE EXTENSION IF NOT EXISTS vector;

# Check index exists
psql> \d embeddings
```

### High Costs

1. Check usage tracking:
   ```typescript
   const stats = await supabase.rpc('get_usage_stats', { user_uuid: userId })
   ```

2. Review model selection logic
3. Implement caching
4. Add rate limiting

### Slow Embeddings

1. Use batch operations
2. Process in background
3. Cache embeddings for common queries

### Rate Limit Errors

```typescript
try {
  const response = await sendMessage(text)
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Show user-friendly message
    alert('Too many requests. Please wait a minute.')
  }
}
```

## Best Practices

1. **Always use cost tracking** - Monitor every request
2. **Implement rate limiting** - Prevent abuse
3. **Cache when possible** - Reduce redundant calls
4. **Use appropriate models** - Don't use GPT-4 for simple tasks
5. **Validate inputs** - Prevent jailbreaks and excessive inputs
6. **Monitor usage** - Set up alerts for unusual spending
7. **Test thoroughly** - AI responses can be unpredictable
8. **Handle errors gracefully** - Provide fallbacks
9. **Secure API keys** - Never expose in client code
10. **Document system prompts** - Version control your prompts

## Resources

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Anthropic Documentation](https://docs.anthropic.com)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai)
- [Cost Optimization Guide](../../docs/07-ai-integration/COST-OPTIMIZATION.md)
- [AI API Call Pattern](../../docs/patterns/AI-API-CALL.md)

## License

MIT
