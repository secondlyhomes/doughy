# Common Issues & Solutions

## Overview

Universal troubleshooting patterns and solutions gathered from production React Native + Supabase apps.

## Race Conditions

### Double-Invocation on Button Press

**Problem:** UI button swap causes pending OS events to fire on wrong button.

```typescript
// ❌ User taps fast, action fires twice
const handlePress = () => {
  setLoading(true);
  doAction();
};
```

**Solution:** Use guard refs to prevent double-invocation.

```typescript
// ✅ Guard prevents double execution
const isProcessingRef = useRef(false);

const handlePress = async () => {
  if (isProcessingRef.current) return;
  isProcessingRef.current = true;

  try {
    await doAction();
  } finally {
    isProcessingRef.current = false;
  }
};
```

### Module-Level Variables Persisting

**Problem:** Module-level state shared between component re-renders.

```typescript
// ❌ BAD: Shared across all instances
let isActive = false;

function useMyHook() {
  // isActive is shared!
}
```

**Solution:** Move to React refs inside hooks.

```typescript
// ✅ GOOD: Per-hook instance
function useMyHook() {
  const isActiveRef = useRef(false);
  // Each hook instance has its own ref
}
```

### Event Listeners Stacking

**Problem:** Hook called every render adds duplicate listeners.

**Solution:** Use useEffect with empty deps, use refs for handlers.

```typescript
// ✅ Register listener once
const handlerRef = useRef(handleEvent);
handlerRef.current = handleEvent; // Keep handler fresh

useEffect(() => {
  const listener = (event) => handlerRef.current(event);
  emitter.addListener('event', listener);
  return () => emitter.removeListener('event', listener);
}, []); // Empty deps = runs once
```

### Timers Firing After Cleanup

**Problem:** setTimeout can fire after component unmounts.

```typescript
// ❌ Can cause "setState on unmounted component"
setTimeout(() => {
  setData(newData);
}, 1000);
```

**Solution:** Check mounted ref before executing.

```typescript
// ✅ Check if still mounted
const isMountedRef = useRef(true);

useEffect(() => {
  const timer = setTimeout(() => {
    if (isMountedRef.current) {
      setData(newData);
    }
  }, 1000);

  return () => {
    isMountedRef.current = false;
    clearTimeout(timer);
  };
}, []);
```

### Guard Reset Too Early

**Problem:** Guard released when async returns, not when state changes.

```typescript
// ❌ Guard resets before state updates
isStartingRef.current = true;
await startOperation(); // Returns immediately
isStartingRef.current = false; // But operation still running!
```

**Solution:** Reset guard when actual state changes.

```typescript
// ✅ Reset when state actually changes
useEffect(() => {
  if (operation.isRunning) {
    isStartingRef.current = false;
  }
}, [operation.isRunning]);
```

## Audio/Native Module Conflicts

### Audio Session Fights

**Problem:** expo-audio and expo-speech-recognition fight for iOS AVAudioSession.

```typescript
// ❌ Sound grabs audio session, blocks speech
playFeedbackSound();
await startListening(); // Fails!
```

**Solution:** Use haptics instead of sounds for quick feedback.

```typescript
// ✅ Haptic doesn't interfere with audio session
import * as Haptics from 'expo-haptics';

Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
await startListening(); // Works!
```

## Storage Issues

### Storage Not Available

**Problem:** Safari/Firefox private browsing throws quota/security errors.

**Solution:** Use safe storage wrapper with fallback.

```typescript
// src/utils/safeStorage.ts
class SafeStorage {
  private storage: Storage | null = null;
  private fallback = new Map<string, string>();

  constructor(storageType: 'local' | 'session') {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      // Test if storage works
      storage.setItem('__test__', '1');
      storage.removeItem('__test__');
      this.storage = storage;
    } catch {
      // Use in-memory fallback
      this.storage = null;
    }
  }

  getItem(key: string): string | null {
    if (this.storage) {
      return this.storage.getItem(key);
    }
    return this.fallback.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.storage) {
      this.storage.setItem(key, value);
    } else {
      this.fallback.set(key, value);
    }
  }

  removeItem(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key);
    } else {
      this.fallback.delete(key);
    }
  }
}

export const safeLocalStorage = new SafeStorage('local');
export const safeSessionStorage = new SafeStorage('session');
```

## API Key & Encryption Issues

### Decryption Fails

**Checklist:**
1. Environment variables match between frontend and backend
2. Clear browser storage if keys cached
3. Redeploy Edge Functions after env changes
4. Test in fresh incognito session
5. Use standardized service names ('openai', not 'openai-key')

```typescript
// Clear cached keys
localStorage.removeItem('encryption_key');
sessionStorage.removeItem('encryption_key');
```

## CORS Issues

### Development CORS Blocking

**Problem:** Supabase Edge Functions block local development IPs.

**Solution:** Configure CORS in Edge Function.

```typescript
// supabase/functions/_shared/cors.ts
const allowedOrigins = [
  'https://yourapp.com',
  // Development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
];

export function corsHeaders(origin: string | null) {
  const isAllowed = allowedOrigins.some((allowed) =>
    typeof allowed === 'string'
      ? allowed === origin
      : allowed.test(origin || '')
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}
```

**Testing:**
```bash
# Test with curl
curl -X OPTIONS -H "Origin: http://localhost:8081" \
  https://project.supabase.co/functions/v1/endpoint -v
```

## Graphics/Rendering Issues

### Glass Effect Not Rendering on Tabs

**Problem:** iOS 17+ glass effect doesn't render on pre-mounted tabs.

**Solution:** Force remount on focus using key changes.

```typescript
const [focusKey, setFocusKey] = useState(0);
const hasInitialFocus = useRef(false);

useFocusEffect(() => {
  if (!hasInitialFocus.current) {
    hasInitialFocus.current = true;
    setFocusKey((k) => k + 1); // Trigger remount
  }
});

return <GlassComponent key={`glass-${focusKey}`} />;
```

## System Health Patterns

### Prevent Infinite Growth

```typescript
// Limit history entries
const MAX_HISTORY = 100;

function addToHistory(entry) {
  setHistory((prev) => {
    const updated = [entry, ...prev];
    return updated.slice(0, MAX_HISTORY);
  });
}

// Auto-delete old trash
const TRASH_RETENTION_DAYS = 7;

async function cleanupTrash() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  await supabase
    .from('items')
    .delete()
    .eq('is_trashed', true)
    .lt('trashed_at', cutoff.toISOString());
}
```

### Rate Limiting

```typescript
// Limit batch operations
const MAX_BATCH_SIZE = 50;

async function batchOperation(items) {
  if (items.length > MAX_BATCH_SIZE) {
    throw new Error(`Max ${MAX_BATCH_SIZE} items per batch`);
  }
  // Process items...
}

// Track usage per device
const DAILY_LIMIT = 100;

async function checkUsageLimit(deviceId) {
  const todayKey = `usage:${deviceId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(todayKey);

  if (count === 1) {
    await redis.expire(todayKey, 86400);
  }

  if (count > DAILY_LIMIT) {
    throw new Error('Daily limit exceeded');
  }
}
```

## Debug Utility Pattern

### Centralized Debugging

```typescript
// src/utils/debug.ts
const isProduction = process.env.NODE_ENV === 'production';

type DebugModule = 'api' | 'auth' | 'ui' | 'db';

const debug = {
  log: (module: DebugModule, ...args: any[]) => {
    if (!isProduction) {
      console.log(`[${module.toUpperCase()}]`, ...args);
    }
  },

  warn: (module: DebugModule, ...args: any[]) => {
    if (!isProduction) {
      console.warn(`[${module.toUpperCase()}]`, ...args);
    }
  },

  error: (module: DebugModule, ...args: any[]) => {
    // Always log errors, even in production
    console.error(`[${module.toUpperCase()}]`, ...args);
  },

  time: (label: string) => {
    if (!isProduction) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (!isProduction) {
      console.timeEnd(label);
    }
  },
};

export default debug;

// Usage
debug.log('api', 'Fetching tasks...');
debug.time('fetchTasks');
const tasks = await fetchTasks();
debug.timeEnd('fetchTasks');
```

## Permission Errors

### Root-Owned Files Block Metro

**Problem:** AI tools may create files as root, blocking Metro bundler.

**Solution:** Fix ownership after AI tool usage.

```bash
# Fix permissions
chown -R $(whoami):staff src/
chmod -R 755 src/

# Prevention: Run build commands as your user
```

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Double tap fires twice | Guard ref pattern |
| Timer leaks | Check mounted ref |
| Audio conflicts | Use haptics, not sounds |
| Storage errors | Safe storage wrapper |
| CORS blocking | Configure Edge Function |
| Glass not rendering | Force remount with key |
| Root-owned files | `chown -R $(whoami):staff src/` |
| Infinite growth | Limit collections, auto-cleanup |
