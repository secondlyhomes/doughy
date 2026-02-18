# API Versioning

Comprehensive API versioning system for managing multiple API versions, handling migrations, and maintaining backwards compatibility.

## Table of Contents

- [Overview](#overview)
- [Versioning Strategies](#versioning-strategies)
- [Implementation](#implementation)
- [Version Lifecycle](#version-lifecycle)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## Overview

API versioning allows you to:
- Introduce breaking changes without disrupting existing clients
- Maintain backwards compatibility
- Deprecate old versions gracefully
- Provide clear upgrade paths

### Current Versions

| Version | Status | Released | Deprecated | Sunset |
|---------|--------|----------|------------|--------|
| v1 | Deprecated | 2024-01-01 | 2025-01-01 | 2026-01-01 |
| v2 | Stable | 2025-01-01 | 2026-01-01 | 2027-01-01 |
| v3 | Current | 2026-01-01 | - | - |

## Versioning Strategies

### 1. URL-Based Versioning

Version in the URL path (recommended):

```
GET /api/v1/tasks
GET /api/v2/tasks
GET /api/v3/tasks
```

**Pros:**
- Most visible and explicit
- Easy to test in browser
- Works with all clients

**Cons:**
- Can lead to URL bloat

### 2. Header-Based Versioning

Version in Accept header:

```http
Accept: application/vnd.myapp.v2+json
```

**Pros:**
- Cleaner URLs
- RESTful purists prefer it

**Cons:**
- Less visible
- Harder to test

### 3. Custom Header Versioning

Version in custom header:

```http
X-API-Version: v2
```

**Pros:**
- Simple
- Explicit

**Cons:**
- Non-standard

## Implementation

### Basic Usage

```typescript
import { APIVersionManager } from './APIVersion'

const manager = new APIVersionManager()

// Handle versioned request
const response = await manager.handleRequest({
  version: 'v2',
  endpoint: 'tasks',
  method: 'GET',
  params: { status: 'active' },
})

console.log(response.data)
console.log(response.meta) // Version info, deprecation warnings
```

### Version Detection

```typescript
import { detectAPIVersion } from './APIVersion'

// From URL: /api/v2/tasks
const version1 = detectAPIVersion({ url: '/api/v2/tasks' })
// Returns: 'v2'

// From header: Accept: application/vnd.myapp.v3+json
const version2 = detectAPIVersion({
  headers: { accept: 'application/vnd.myapp.v3+json' }
})
// Returns: 'v3'

// From custom header: X-API-Version: v2
const version3 = detectAPIVersion({
  headers: { 'x-api-version': 'v2' }
})
// Returns: 'v2'
```

### Client SDK

```typescript
import { APIClient } from './APIVersion'

// Create client with specific version
const client = new APIClient('https://api.example.com', 'v2')

// Make requests
const tasks = await client.get('tasks', { status: 'active' })
const task = await client.post('tasks', { title: 'New task' })
const updated = await client.patch(`tasks/${taskId}`, { status: 'done' })

// Switch versions
client.setVersion('v3')
```

### Express Middleware

```typescript
import express from 'express'
import { detectAPIVersion, apiVersionManager } from './APIVersion'

const app = express()

app.use(async (req, res, next) => {
  const version = detectAPIVersion(req)

  const response = await apiVersionManager.handleRequest({
    version,
    endpoint: req.params.endpoint,
    method: req.method as any,
    params: req.query,
    body: req.body,
  })

  if (response.error) {
    return res.status(400).json(response)
  }

  // Add deprecation warning header
  if (response.meta?.deprecated) {
    res.set('X-API-Deprecated', 'true')
    res.set('X-API-Sunset-Date', response.meta.sunsetDate!)
  }

  res.json(response)
})
```

## Version Lifecycle

### 1. Development

New version is in active development:

```typescript
const VERSION_METADATA = {
  v4: {
    version: 'v4',
    releaseDate: '2027-01-01', // Future
    breaking_changes: [
      'GraphQL-only interface',
      'Real-time by default',
    ],
    new_features: [
      'Subscriptions',
      'Enhanced filtering',
    ],
  },
}
```

### 2. Beta

Version available for testing:

```typescript
// Enable for specific users only
if (user.betaAccess) {
  client.setVersion('v4-beta')
}
```

### 3. Stable

Version is production-ready:

```typescript
export const CURRENT_VERSION: APIVersion = 'v3'
export const SUPPORTED_VERSIONS: APIVersion[] = ['v2', 'v3']
```

### 4. Deprecated

Version is no longer recommended:

```typescript
export const DEPRECATED_VERSIONS: APIVersion[] = ['v1']

// Clients receive warnings
{
  "meta": {
    "deprecated": true,
    "deprecationDate": "2025-01-01",
    "sunsetDate": "2026-01-01",
    "upgradeUrl": "/docs/api/migration/v1-to-v3"
  }
}
```

### 5. Sunset

Version is removed:

```typescript
// After sunset date, return error
if (version === 'v1' && new Date() > new Date('2026-01-01')) {
  return {
    error: {
      code: 'version_sunset',
      message: 'API v1 has been sunset. Please upgrade to v3.',
    }
  }
}
```

## Usage Examples

### Example 1: Multi-Version API

```typescript
class TaskAPI {
  async getTasks(version: APIVersion, params: any) {
    const manager = new APIVersionManager()

    return manager.handleRequest({
      version,
      endpoint: 'tasks',
      method: 'GET',
      params,
    })
  }
}

// Client using v2
const v2Response = await api.getTasks('v2', { page: 1 })
// Returns: { data: [...], pagination: {...} }

// Client using v3
const v3Response = await api.getTasks('v3', { page: 1 })
// Returns: { data: [...], pagination: {...}, links: {...} }
```

### Example 2: Gradual Migration

```typescript
// Start with v2
const client = new APIClient(API_URL, 'v2')

// Migrate endpoint by endpoint
const tasks = await client.get('tasks') // v2

client.setVersion('v3')
const newTask = await client.post('tasks', task) // v3

client.setVersion('v2')
const users = await client.get('users') // back to v2
```

### Example 3: Version-Specific Features

```typescript
async function createTask(task: Task) {
  const version = detectAPIVersion(request)

  if (version === 'v3') {
    // v3 supports batch operations
    return client.post('tasks.batch', {
      operations: [
        { method: 'POST', data: task },
      ],
    })
  } else {
    // v1 and v2 use single operations
    return client.post('tasks', task)
  }
}
```

### Example 4: Backwards Compatibility

```typescript
class APIVersionManager {
  private async getTasksV1(request: APIRequest) {
    // Get from database
    const tasks = await supabase.from('tasks').select('*')

    // Transform to v1 format
    return {
      success: true,
      data: tasks.map(task => ({
        id: task.id,
        title: task.title,
        createdAt: new Date(task.created_at).getTime(), // v1 used timestamps
        updatedAt: new Date(task.updated_at).getTime(),
      })),
      count: tasks.length,
    }
  }

  private async getTasksV2(request: APIRequest) {
    const tasks = await supabase.from('tasks').select('*')

    // Transform to v2 format
    return {
      data: tasks.map(task => ({
        id: task.id,
        title: task.title,
        created_at: task.created_at, // v2 uses ISO dates
        updated_at: task.updated_at,
      })),
      pagination: {
        page: 1,
        limit: 20,
        total: tasks.length,
      },
    }
  }
}
```

### Example 5: Breaking Change Handling

```typescript
// v2 → v3 breaking change: IDs changed from int to UUID
const manager = new APIVersionManager()

async migrateV2toV3(data: any) {
  return {
    ...data,
    id: this.ensureUUID(data.id), // Convert int to UUID
    user_id: this.ensureUUID(data.user_id),
  }
}

private ensureUUID(id: any): string {
  if (typeof id === 'string' && id.match(/^[0-9a-f-]{36}$/)) {
    return id // Already UUID
  }

  // Use migration mapping table
  const { data } = await supabase
    .from('id_migrations')
    .select('new_uuid')
    .eq('old_id', id)
    .single()

  return data.new_uuid
}
```

## Migration Guide

### V1 to V2 Migration

**Breaking Changes:**
- Date format changed from Unix timestamp to ISO 8601
- Field names changed from camelCase to snake_case
- Removed deprecated fields: `oldStatus`, `legacyId`

**Migration Steps:**

1. Update date handling:
```typescript
// V1
const task = { createdAt: 1640995200000 }

// V2
const task = { created_at: '2022-01-01T00:00:00Z' }
```

2. Update field names:
```typescript
// V1
const task = { createdAt, updatedAt }

// V2
const task = { created_at, updated_at }
```

3. Remove deprecated fields:
```typescript
// V1
const task = { oldStatus, legacyId }

// V2 - remove these fields
const task = { /* removed */ }
```

### V2 to V3 Migration

**Breaking Changes:**
- IDs changed from sequential integers to UUIDs
- Nested resources moved to separate endpoints
- Error format changed to RFC 7807

**Migration Steps:**

1. Update ID handling:
```typescript
// V2
const taskId = 123

// V3
const taskId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
```

2. Update nested resource calls:
```typescript
// V2 - subtasks included in task
const task = await client.get(`tasks/${id}`) // includes subtasks

// V3 - subtasks separate
const task = await client.get(`tasks/${id}`)
const subtasks = await client.get(`tasks/${id}/subtasks`)
```

3. Update error handling:
```typescript
// V2
{
  error: 'Not found',
  code: 404
}

// V3 - RFC 7807
{
  type: '/errors/not-found',
  title: 'Not Found',
  status: 404,
  detail: 'Task not found',
  instance: '/api/v3/tasks/123'
}
```

## Best Practices

### 1. Version Early

Start with v1 from day one:

```typescript
// Good
GET /api/v1/tasks

// Bad
GET /api/tasks // No version
```

### 2. Use Semantic Versioning

Major.Minor.Patch:

```typescript
export const API_VERSIONS = {
  v1: '1.0.0', // Major version
  v2: '2.0.0', // Breaking changes
  v3: '3.0.0', // More breaking changes
}
```

### 3. Deprecate Gradually

Give users time to migrate:

```typescript
const DEPRECATION_TIMELINE = {
  announcement: '2025-01-01', // Announce deprecation
  deprecation: '2025-06-01',  // Mark deprecated (6 months)
  sunset: '2026-01-01',        // Remove (1 year)
}
```

### 4. Document Everything

```typescript
/**
 * Get tasks
 *
 * @version v3
 * @since 2026-01-01
 * @breaking Changed from v2: Uses UUIDs instead of integers
 * @param params.fields - Select specific fields (v3 only)
 */
async getTasks(params: GetTasksParams) {
  // ...
}
```

### 5. Maintain Old Versions

Don't break old clients:

```typescript
// Keep v1 and v2 working even after v3 release
export const SUPPORTED_VERSIONS = ['v1', 'v2', 'v3']
```

### 6. Provide Migration Tools

```typescript
// Migration helper
export async function migrateV2toV3(v2Data: any) {
  const v3Data = await transform(v2Data)
  await validate(v3Data)
  return v3Data
}

// CLI tool
$ npm run migrate-api v2 v3
```

### 7. Use Feature Flags

Gradually roll out new versions:

```typescript
if (featureFlags.isEnabled('api-v3')) {
  client.setVersion('v3')
} else {
  client.setVersion('v2')
}
```

### 8. Monitor Version Usage

```typescript
async function trackAPIUsage(version: APIVersion, endpoint: string) {
  await analytics.track('api_request', {
    version,
    endpoint,
    timestamp: new Date(),
  })
}

// Review which versions are still in use
const versionStats = await analytics.query(`
  SELECT version, COUNT(*) as requests
  FROM api_requests
  WHERE timestamp > now() - interval '30 days'
  GROUP BY version
`)
```

### 9. Test All Versions

```typescript
describe('API Versions', () => {
  it('v1 returns correct format', async () => {
    const response = await api.request({ version: 'v1', endpoint: 'tasks' })
    expect(response.data).toHaveProperty('createdAt') // timestamp
  })

  it('v2 returns correct format', async () => {
    const response = await api.request({ version: 'v2', endpoint: 'tasks' })
    expect(response.data).toHaveProperty('created_at') // ISO date
  })

  it('v3 returns correct format', async () => {
    const response = await api.request({ version: 'v3', endpoint: 'tasks' })
    expect(response.data[0].id).toMatch(/^[0-9a-f-]{36}$/) // UUID
  })
})
```

### 10. Communicate Changes

```typescript
// In response headers
res.set('X-API-Version', 'v2')
res.set('X-API-Deprecated', 'true')
res.set('X-API-Sunset-Date', '2026-01-01')
res.set('X-API-Migration-Guide', '/docs/api/migration/v2-to-v3')

// In response body
{
  meta: {
    version: 'v2',
    deprecated: true,
    deprecationDate: '2025-06-01',
    sunsetDate: '2026-01-01',
    upgradeUrl: '/docs/api/migration/v2-to-v3'
  }
}
```

## Common Patterns

### Pattern 1: Version Negotiation

```typescript
function negotiateVersion(requestedVersion: string): APIVersion {
  // Client requests non-existent version
  if (!SUPPORTED_VERSIONS.includes(requestedVersion as APIVersion)) {
    // Fallback to latest supported
    return CURRENT_VERSION
  }

  return requestedVersion as APIVersion
}
```

### Pattern 2: Adapter Pattern

```typescript
class TaskAdapterV1 {
  toExternal(task: Task) {
    return {
      id: task.id,
      createdAt: new Date(task.created_at).getTime(),
    }
  }

  fromExternal(data: any): Task {
    return {
      id: data.id,
      created_at: new Date(data.createdAt).toISOString(),
    }
  }
}

class TaskAdapterV2 {
  toExternal(task: Task) {
    return {
      id: task.id,
      created_at: task.created_at,
    }
  }
}
```

### Pattern 3: Version-Specific Controllers

```typescript
// controllers/v1/TaskController.ts
export class TaskControllerV1 {
  async index() {
    const tasks = await Task.findAll()
    return { success: true, data: tasks }
  }
}

// controllers/v2/TaskController.ts
export class TaskControllerV2 {
  async index(req: Request) {
    const { page, limit } = req.query
    const tasks = await Task.paginate(page, limit)
    return { data: tasks, pagination: {...} }
  }
}
```

## Troubleshooting

### Issue: Clients not receiving deprecation warnings

**Solution:**
```typescript
// Ensure warnings are in response
if (DEPRECATED_VERSIONS.includes(version)) {
  response.meta = {
    ...response.meta,
    deprecated: true,
    deprecationDate: VERSION_METADATA[version].deprecationDate,
    sunsetDate: VERSION_METADATA[version].sunsetDate,
  }
}
```

### Issue: Breaking changes not detected

**Solution:**
```typescript
// Use automated tools
$ npm run api-diff v2 v3
Breaking changes detected:
  - Field 'id' changed from number to string
  - Field 'createdAt' renamed to 'created_at'
  - Field 'oldStatus' removed
```

### Issue: Too many versions to maintain

**Solution:**
```typescript
// Only support current + previous major version
export const SUPPORTED_VERSIONS = [
  CURRENT_VERSION,
  PREVIOUS_VERSION,
]

// Sunset older versions aggressively
```

## Conclusion

API versioning is essential for:
- Evolving your API without breaking clients
- Providing smooth upgrade paths
- Maintaining professional API quality
- Building long-term API products

Start with URL-based versioning, plan for deprecation from day one, and communicate changes clearly to your users.
