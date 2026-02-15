# Feature Flags Pattern

> Gradual rollouts and A/B testing for React Native apps.

## Overview

Feature flags enable controlled rollouts, A/B testing, and quick feature toggles without deploying new app versions. This pattern covers a database-driven feature flag system with Supabase.

## Database Schema

```sql
-- Feature flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-tenant overrides
CREATE TABLE tenant_feature_overrides (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, feature_flag_id)
);

-- Per-user overrides (for beta testers, etc.)
CREATE TABLE user_feature_overrides (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_flag_id UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, feature_flag_id)
);

-- Seed example flags
INSERT INTO feature_flags (key, name, description, enabled, rollout_percentage) VALUES
  ('new_dashboard', 'New Dashboard', 'Redesigned dashboard experience', false, 0),
  ('ai_suggestions', 'AI Suggestions', 'AI-powered task suggestions', true, 50),
  ('dark_mode_v2', 'Dark Mode V2', 'Updated dark theme', true, 100);
```

## Row Level Security

```sql
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags
CREATE POLICY "Read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Tenant overrides visible to tenant members
CREATE POLICY "Read tenant overrides"
  ON tenant_feature_overrides FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- User overrides only visible to the user
CREATE POLICY "Read own overrides"
  ON user_feature_overrides FOR SELECT
  USING (user_id = auth.uid());
```

## Feature Flag Service

```typescript
// src/services/featureFlags.ts
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions: Record<string, unknown>;
}

interface FeatureFlagState {
  flags: Record<string, boolean>;
  lastFetched: number;
}

const CACHE_KEY = 'feature_flags_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class FeatureFlagService {
  private flags: Map<string, boolean> = new Map();
  private userId: string | null = null;
  private tenantId: string | null = null;

  setContext(userId: string, tenantId: string) {
    this.userId = userId;
    this.tenantId = tenantId;
  }

  async initialize(): Promise<void> {
    // Try cache first
    const cached = await this.loadFromCache();
    if (cached) {
      this.flags = new Map(Object.entries(cached.flags));
    }

    // Fetch fresh data
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const flags = await this.fetchFlags();

    for (const flag of flags) {
      const isEnabled = await this.evaluateFlag(flag);
      this.flags.set(flag.key, isEnabled);
    }

    await this.saveToCache();
  }

  private async fetchFlags(): Promise<FeatureFlag[]> {
    const { data } = await supabase
      .from('feature_flags')
      .select('*');

    return (data || []).map(f => ({
      id: f.id,
      key: f.key,
      enabled: f.enabled,
      rolloutPercentage: f.rollout_percentage,
      conditions: f.conditions,
    }));
  }

  private async evaluateFlag(flag: FeatureFlag): Promise<boolean> {
    // Check user override first
    if (this.userId) {
      const { data: userOverride } = await supabase
        .from('user_feature_overrides')
        .select('enabled')
        .eq('user_id', this.userId)
        .eq('feature_flag_id', flag.id)
        .single();

      if (userOverride) return userOverride.enabled;
    }

    // Check tenant override
    if (this.tenantId) {
      const { data: tenantOverride } = await supabase
        .from('tenant_feature_overrides')
        .select('enabled')
        .eq('tenant_id', this.tenantId)
        .eq('feature_flag_id', flag.id)
        .single();

      if (tenantOverride) return tenantOverride.enabled;
    }

    // Check if globally disabled
    if (!flag.enabled) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId || 'anonymous');
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  isEnabled(key: string): boolean {
    return this.flags.get(key) ?? false;
  }

  private async loadFromCache(): Promise<FeatureFlagState | null> {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const state: FeatureFlagState = JSON.parse(cached);
    if (Date.now() - state.lastFetched > CACHE_TTL) return null;

    return state;
  }

  private async saveToCache(): Promise<void> {
    const state: FeatureFlagState = {
      flags: Object.fromEntries(this.flags),
      lastFetched: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(state));
  }
}

export const featureFlags = new FeatureFlagService();
```

## Feature Flag Hook

```typescript
// src/hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';
import { featureFlags } from '@/services/featureFlags';

export const useFeatureFlag = (key: string): boolean => {
  const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(key));

  useEffect(() => {
    // Re-evaluate when flags refresh
    const checkFlag = () => setEnabled(featureFlags.isEnabled(key));

    // Initial check
    checkFlag();

    // Could add subscription to flag changes here
  }, [key]);

  return enabled;
};

// Multiple flags
export const useFeatureFlags = (keys: string[]): Record<string, boolean> => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const result: Record<string, boolean> = {};
    keys.forEach(key => {
      result[key] = featureFlags.isEnabled(key);
    });
    setFlags(result);
  }, [keys.join(',')]);

  return flags;
};
```

## Feature Gate Component

```typescript
// src/components/FeatureGate.tsx
import React from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback = null,
  children,
}) => {
  const isEnabled = useFeatureFlag(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// Usage example
// <FeatureGate feature="new_dashboard" fallback={<OldDashboard />}>
//   <NewDashboard />
// </FeatureGate>
```

## Feature Flag Admin Screen

```typescript
// src/screens/feature-flags-admin-screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Switch, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface Flag {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  rollout_percentage: number;
}

export const FeatureFlagsAdminScreen: React.FC = () => {
  const { colors } = useTheme();
  const [flags, setFlags] = useState<Flag[]>([]);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    const { data } = await supabase
      .from('feature_flags')
      .select('*')
      .order('key');
    setFlags(data || []);
  };

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', flagId);
    await loadFlags();
  };

  const renderFlag = ({ item }: { item: Flag }) => (
    <View style={[styles.flagItem, { borderBottomColor: colors.border }]}>
      <View style={styles.flagInfo}>
        <Text style={[styles.flagKey, { color: colors.text }]}>{item.key}</Text>
        <Text style={[styles.flagName, { color: colors.textSecondary }]}>
          {item.name} ({item.rollout_percentage}%)
        </Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={(value) => toggleFlag(item.id, value)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={flags}
        keyExtractor={(item) => item.id}
        renderItem={renderFlag}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flagItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  flagInfo: { flex: 1 },
  flagKey: { fontSize: 16, fontWeight: '500' },
  flagName: { fontSize: 13, marginTop: 4 },
});
```

## Implementation Examples

See `.examples/enterprise/feature-flags/` for a complete feature flag system with analytics.

## Related Patterns

- [API Versioning](./API-VERSIONING.md)
- [A/B Testing](./AB-TESTING.md)
