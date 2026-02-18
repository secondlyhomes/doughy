# API Versioning Pattern

> Managing API changes in React Native apps with Supabase Edge Functions.

## Overview

API versioning ensures backward compatibility when making changes to your API. This pattern covers versioning strategies for Supabase Edge Functions and client-side handling.

## Versioning Strategy

### URL-Based Versioning

```typescript
// supabase/functions/api/index.ts
import { handleV1 } from './v1/handler.ts';
import { handleV2 } from './v2/handler.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const version = url.pathname.split('/')[1]; // e.g., /v1/users

  switch (version) {
    case 'v1':
      return handleV1(req);
    case 'v2':
      return handleV2(req);
    default:
      return new Response('API version not found', { status: 404 });
  }
});
```

### Header-Based Versioning

```typescript
// supabase/functions/api/index.ts
Deno.serve(async (req) => {
  const version = req.headers.get('X-API-Version') || '1';

  switch (version) {
    case '1':
      return handleV1(req);
    case '2':
      return handleV2(req);
    default:
      return new Response('Unsupported API version', { status: 400 });
  }
});
```

## Database Schema for Version Support

```sql
-- API version configuration
CREATE TABLE api_versions (
  version TEXT PRIMARY KEY,
  status TEXT CHECK (status IN ('active', 'deprecated', 'sunset')),
  sunset_date DATE,
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO api_versions (version, status) VALUES
  ('v1', 'deprecated'),
  ('v2', 'active');

-- Per-tenant API version preferences
CREATE TABLE tenant_api_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  preferred_version TEXT REFERENCES api_versions(version),
  auto_upgrade BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Client with Version Support

```typescript
// src/services/api.ts
import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface APIClientConfig {
  version?: string;
  timeout?: number;
}

class APIClient {
  private version: string;
  private timeout: number;
  private baseUrl: string;

  constructor(config: APIClientConfig = {}) {
    this.version = config.version || 'v2';
    this.timeout = config.timeout || 30000;
    this.baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/api';
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();

    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
      'X-API-Version': this.version,
      'X-Client-Platform': Platform.OS,
      'X-Client-Version': Constants.expoConfig?.version || '1.0.0',
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/${this.version}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      });

      // Check for deprecation warnings
      const deprecationWarning = response.headers.get('X-API-Deprecation');
      if (deprecationWarning) {
        console.warn('API Deprecation:', deprecationWarning);
      }

      if (!response.ok) {
        throw new APIError(response.status, await response.text());
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  setVersion(version: string) {
    this.version = version;
  }
}

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = new APIClient();
```

## Version Migration Helper

```typescript
// src/services/apiMigration.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

interface VersionInfo {
  current: string;
  latest: string;
  deprecated: string[];
  sunsetDates: Record<string, string>;
}

export const checkAPIVersion = async (): Promise<VersionInfo> => {
  const info = await api.get<VersionInfo>('/version');

  // Store for offline reference
  await AsyncStorage.setItem('api_version_info', JSON.stringify(info));

  return info;
};

export const shouldUpgradeAPI = async (): Promise<boolean> => {
  const storedVersion = await AsyncStorage.getItem('preferred_api_version');
  const info = await checkAPIVersion();

  return storedVersion !== info.latest;
};
```

## Version-Aware Response Transformer

```typescript
// src/services/responseTransformer.ts

interface UserV1 {
  id: string;
  name: string;
  email: string;
}

interface UserV2 {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

// Transform V1 response to V2 format for consistency
export const transformUserResponse = (data: UserV1 | UserV2, version: string): UserV2 => {
  if (version === 'v1') {
    const v1Data = data as UserV1;
    const [firstName, ...lastNameParts] = v1Data.name.split(' ');
    return {
      id: v1Data.id,
      firstName,
      lastName: lastNameParts.join(' '),
      email: v1Data.email,
      createdAt: new Date().toISOString(), // V1 didn't have this
    };
  }
  return data as UserV2;
};
```

## Edge Function with Version Handlers

```typescript
// supabase/functions/api/v1/handler.ts
export async function handleV1(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/v1', '');

  // Add deprecation warning
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Deprecation': 'v1 is deprecated. Please migrate to v2 by 2026-06-01',
  };

  switch (path) {
    case '/users':
      const users = await getUsers();
      // V1 format: combined name field
      const v1Users = users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
      }));
      return new Response(JSON.stringify(v1Users), { headers });
    default:
      return new Response('Not found', { status: 404 });
  }
}

// supabase/functions/api/v2/handler.ts
export async function handleV2(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/v2', '');

  switch (path) {
    case '/users':
      const users = await getUsers();
      // V2 format: separate name fields, includes timestamps
      return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' },
      });
    default:
      return new Response('Not found', { status: 404 });
  }
}
```

## Version Notification Component

```typescript
// src/components/APIVersionNotice.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { checkAPIVersion } from '@/services/apiMigration';
import { useTheme } from '@/contexts/ThemeContext';

export const APIVersionNotice: React.FC = () => {
  const { colors } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    checkDeprecation();
  }, []);

  const checkDeprecation = async () => {
    const info = await checkAPIVersion();
    if (info.deprecated.includes(info.current)) {
      setNotice(`API version ${info.current} is deprecated. Upgrade available.`);
    }
  };

  if (!notice) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <Text style={styles.text}>{notice}</Text>
      <TouchableOpacity onPress={() => setNotice(null)}>
        <Text style={styles.dismiss}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, flexDirection: 'row', justifyContent: 'space-between' },
  text: { color: '#000', flex: 1, fontSize: 14 },
  dismiss: { color: '#000', fontWeight: '600', marginLeft: 12 },
});
```

## Implementation Examples

See `.examples/enterprise/api-versioning/` for complete versioning implementation.

## Related Patterns

- [Rate Limiting](./RATE-LIMITING.md)
- [Feature Flags](./FEATURE-FLAGS.md)
