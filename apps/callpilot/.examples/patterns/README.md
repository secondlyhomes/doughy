# Implementation Patterns

Guides and examples for common implementation patterns in the blueprint.

## Overview

This directory contains **pattern guides** - practical examples showing how to implement common features and integrations. Each pattern includes code examples, best practices, and security considerations.

## Available Patterns

### 🔐 Supabase Vault

**File:** `supabase-vault.md`

How to securely store and retrieve API keys using Supabase Vault with `pgsodium` encryption.

**When to use:**
- Storing OpenAI API keys
- Storing Stripe secret keys
- Storing any third-party API credentials

**Key concepts:**
- Server-side secret storage
- Encrypted at rest
- Retrieved only in Edge Functions
- Never exposed to client

**Quick example:**
```sql
-- Store secret
INSERT INTO vault.secrets (name, secret)
VALUES ('openai_api_key', 'sk-proj-...');

-- Retrieve in Edge Function
SELECT decrypted_secret FROM vault.decrypted_secrets
WHERE name = 'openai_api_key';
```

[Full guide →](supabase-vault.md)

---

### 📱 Push Notifications

**Status:** Coming in Phase 2, Week 3

How to implement push notifications with Expo and Supabase.

**Topics:**
- Requesting permissions
- Getting push tokens
- Storing tokens in database
- Sending notifications from Edge Functions
- Handling notification taps

---

### 🔄 Offline Sync

**Status:** Coming in Phase 2, Week 3

How to implement offline-first functionality with local caching.

**Topics:**
- AsyncStorage for persistence
- Optimistic updates
- Conflict resolution
- Sync strategies

---

### 🤖 AI Integration

**Status:** Coming in Phase 2, Week 3

How to integrate AI APIs (OpenAI, Anthropic) securely.

**Topics:**
- Secure API key storage (Vault)
- Edge Functions for AI calls
- Streaming responses
- Cost optimization
- Error handling

---

## Usage

1. **Read the pattern guide** - Understand the approach and security considerations
2. **Follow the examples** - Copy code snippets and adapt to your needs
3. **Check related docs** - See comprehensive documentation in `docs/` directory

## Pattern Structure

Each pattern guide includes:

1. **Overview** - What the pattern is for
2. **Quick Start** - Minimal working example
3. **Complete Example** - Full implementation with all features
4. **Key Points** - Do's and don'ts
5. **Related Docs** - Links to comprehensive documentation

## Related Documentation

### Security
- [API Key Management](../../docs/09-security/API-KEY-MANAGEMENT.md) - Comprehensive Vault guide
- [Security Checklist](../../docs/09-security/SECURITY-CHECKLIST.md) - Pre-launch audit
- [Prompt Injection Security](../../docs/09-security/PROMPT-INJECTION-SECURITY.md) - AI security

### Database
- [Supabase Setup](../../docs/03-database/SUPABASE-SETUP.md) - Getting started
- [Supabase Table Pattern](../../docs/patterns/SUPABASE-TABLE.md) - Creating tables with RLS

### Features
- [New Feature Pattern](../../docs/patterns/NEW-FEATURE.md) - Feature implementation workflow
- [New Screen Pattern](../../docs/patterns/NEW-SCREEN.md) - Screen component pattern

### AI Integration
- [AI API Call Pattern](../../docs/patterns/AI-API-CALL.md) - AI integration guide
- [Cost Optimization](../../docs/07-ai-integration/COST-OPTIMIZATION.md) - Managing AI costs

## Best Practices

### Security

1. **Never store secrets in client code**
   ```typescript
   // ❌ Bad
   const API_KEY = 'sk-proj-abc123...'

   // ✅ Good
   // Store in Vault, retrieve in Edge Function
   ```

2. **Always use RLS policies**
   ```sql
   -- ✅ Always enable RLS
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users see own tasks"
     ON tasks FOR SELECT
     USING (auth.uid() = user_id);
   ```

3. **Validate all inputs**
   ```typescript
   // ✅ Validate before processing
   if (!input || typeof input !== 'string') {
     throw new Error('Invalid input')
   }
   ```

### Performance

1. **Cache when appropriate**
   ```typescript
   // Cache API responses in Edge Functions
   let cachedSecret: string | null = null

   if (!cachedSecret) {
     cachedSecret = await getSecretFromVault()
   }
   ```

2. **Use optimistic updates**
   ```typescript
   // Update UI immediately, sync in background
   setTasks([...tasks, newTask])
   await saveToDatabase(newTask)
   ```

3. **Batch operations**
   ```typescript
   // Batch multiple operations
   await supabase.from('tasks').insert(tasks) // Multiple rows at once
   ```

### Code Quality

1. **Follow TypeScript patterns**
   ```typescript
   // ✅ Define types
   interface Task {
     id: string
     title: string
     user_id: string
   }
   ```

2. **Handle errors gracefully**
   ```typescript
   try {
     const result = await riskyOperation()
     return result
   } catch (error) {
     console.error('Operation failed:', error)
     // Show user-friendly error
     showErrorState('Something went wrong')
   }
   ```

3. **Keep functions focused**
   ```typescript
   // ✅ Each function does one thing
   async function fetchTasks() { }
   async function createTask() { }
   async function updateTask() { }
   ```

## Contributing

Found a better way to implement a pattern? Open an issue or PR!

## Questions?

- **Security questions:** See [docs/09-security/](../../docs/09-security/)
- **Database questions:** See [docs/03-database/](../../docs/03-database/)
- **AI questions:** See [docs/07-ai-integration/](../../docs/07-ai-integration/)
- **General patterns:** See [docs/patterns/](../../docs/patterns/)

---

**Need help?** Check [QUICKSTART.md](../../QUICKSTART.md) or [CONTRIBUTING.md](../../CONTRIBUTING.md)
