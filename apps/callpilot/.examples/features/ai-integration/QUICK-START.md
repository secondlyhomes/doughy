# AI Integration - Quick Start Guide

Get AI features running in 5 minutes.

## 1. Database Setup (2 minutes)

```bash
# Copy schema.sql content
# Go to Supabase Dashboard → SQL Editor → New Query
# Paste and run the schema
```

Or via CLI:
```bash
cd database
psql "postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres" < schema.sql
```

## 2. Environment Variables (1 minute)

Add to `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

In Supabase Dashboard → Edge Functions → Secrets:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Basic Chat (2 minutes)

```tsx
// app/_layout.tsx
import { AIProvider } from '@/features/ai-integration/AIContext'

export default function RootLayout() {
  return (
    <AIProvider defaultModel="gpt-4o-mini">
      <Stack />
    </AIProvider>
  )
}
```

```tsx
// app/chat.tsx
import { ChatInterface } from '@/features/ai-integration/components/ChatInterface'

export default function ChatScreen() {
  return <ChatInterface />
}
```

That's it! You now have a working AI chat interface.

## Quick Examples

### Simple Chat Message

```tsx
import { useAI } from '@/features/ai-integration/AIContext'

function QuickChat() {
  const { sendMessage, createConversation } = useAI()

  useEffect(() => {
    createConversation('Quick Chat')
  }, [])

  const ask = async (question: string) => {
    const response = await sendMessage(question)
    console.log(response.content)
  }

  return <Button onPress={() => ask('Hello!')} title="Ask AI" />
}
```

### Streaming Response

```tsx
import { useAI } from '@/features/ai-integration/AIContext'

function StreamingChat() {
  const { sendMessageStream } = useAI()
  const [response, setResponse] = useState('')

  const ask = async (question: string) => {
    setResponse('')
    await sendMessageStream(question, (chunk) => {
      if (!chunk.done) {
        setResponse(prev => prev + chunk.delta)
      }
    })
  }

  return (
    <>
      <Text>{response}</Text>
      <Button onPress={() => ask('Tell me a story')} title="Ask" />
    </>
  )
}
```

### Semantic Search

```tsx
import { RAGProvider, useRAG } from '@/features/ai-integration/rag/RAGContext'

function SearchExample() {
  const { search } = useRAG()

  const handleSearch = async (query: string) => {
    const results = await search({ query, limit: 5 })
    console.log(`Found ${results.totalResults} results`)
    results.results.forEach(r => {
      console.log(`${r.content} (${r.similarity})`)
    })
  }

  return <Button onPress={() => handleSearch('authentication')} title="Search" />
}

// Wrap with provider
function App() {
  return (
    <RAGProvider>
      <SearchExample />
    </RAGProvider>
  )
}
```

### Floating Assistant

```tsx
import { AIAssistant } from '@/features/ai-integration/components/AIAssistant'

function App() {
  return (
    <>
      {/* Your app content */}
      <AIAssistant position="bottom-right" />
    </>
  )
}
```

## Cost Estimates

Based on typical usage:

| Feature | Model | Cost per 100 requests | Cost per 1000 requests |
|---------|-------|---------------------|----------------------|
| Chat (short) | gpt-4o-mini | $0.02 | $0.20 |
| Chat (medium) | gpt-4o-mini | $0.05 | $0.50 |
| Chat (long) | gpt-4o | $0.25 | $2.50 |
| Embeddings | text-embedding-3-small | $0.002 | $0.02 |
| Search + Chat | gpt-4o-mini + embeddings | $0.03 | $0.30 |

## Next Steps

1. **Add Rate Limiting** - See [README.md](./README.md#budget-controls)
2. **Implement RAG** - See [README.md](./README.md#rag-implementation-guide)
3. **Optimize Costs** - See [README.md](./README.md#cost-optimization-strategies)
4. **Create Edge Functions** - See `docs/patterns/AI-API-CALL.md`

## Common Issues

### "pgvector extension not found"
```bash
# Enable in Supabase Dashboard:
# Database → Extensions → Search "vector" → Enable
```

### "No response from AI service"
```bash
# Check Edge Function is deployed and has API keys set
# Supabase Dashboard → Edge Functions → [function-name] → Logs
```

### "Rate limit exceeded"
```bash
# Increase limits in rateLimiter.ts or upgrade Upstash Redis plan
```

### "Cost tracking not working"
```bash
# Verify ai_usage table exists
# Check RLS policies allow inserts
```

## File Checklist

- [ ] `database/schema.sql` - Run in Supabase
- [ ] `.env` - Add Supabase credentials
- [ ] Edge Function secrets - Add API keys
- [ ] `AIProvider` - Wrap app
- [ ] Components - Import and use

## Support

- Full documentation: [README.md](./README.md)
- Database setup: [database/MIGRATIONS.md](./database/MIGRATIONS.md)
- Pattern docs: `docs/patterns/AI-API-CALL.md`
- Cost guide: `docs/07-ai-integration/COST-OPTIMIZATION.md`
