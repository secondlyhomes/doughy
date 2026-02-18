# Compliance Pattern

> GDPR, SOC2, and HIPAA considerations for React Native apps with Supabase.

## Overview

Enterprise applications must meet various regulatory requirements. This pattern covers implementing compliance controls for GDPR (data privacy), SOC2 (security), and HIPAA (healthcare data).

## Data Privacy (GDPR)

### User Consent Tracking

```sql
-- Consent records
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_consents ON user_consents(user_id, consent_type);
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own consents"
  ON user_consents FOR ALL
  USING (user_id = auth.uid());
```

### Consent Management Hook

```typescript
// src/hooks/useConsent.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type ConsentType = 'marketing' | 'analytics' | 'personalization';

interface Consent {
  type: ConsentType;
  granted: boolean;
  grantedAt?: Date;
}

export const useConsent = () => {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) loadConsents();
  }, [user]);

  const loadConsents = async () => {
    const { data } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user!.id)
      .is('revoked_at', null);

    setConsents(data?.map(c => ({
      type: c.consent_type,
      granted: c.granted,
      grantedAt: c.granted_at ? new Date(c.granted_at) : undefined,
    })) || []);
    setIsLoading(false);
  };

  const updateConsent = async (type: ConsentType, granted: boolean) => {
    // Revoke existing consent
    await supabase
      .from('user_consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user!.id)
      .eq('consent_type', type)
      .is('revoked_at', null);

    // Create new consent record
    await supabase.from('user_consents').insert({
      user_id: user!.id,
      consent_type: type,
      granted,
      granted_at: granted ? new Date().toISOString() : null,
    });

    await loadConsents();
  };

  const hasConsent = (type: ConsentType) =>
    consents.find(c => c.type === type)?.granted ?? false;

  return { consents, updateConsent, hasConsent, isLoading };
};
```

### Privacy Settings Screen

```typescript
// src/screens/privacy-settings-screen.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { useConsent, ConsentType } from '@/hooks/useConsent';
import { useTheme } from '@/contexts/ThemeContext';

const consentOptions: { type: ConsentType; title: string; description: string }[] = [
  {
    type: 'analytics',
    title: 'Analytics',
    description: 'Help us improve by sharing usage data',
  },
  {
    type: 'marketing',
    title: 'Marketing Communications',
    description: 'Receive updates about new features and offers',
  },
  {
    type: 'personalization',
    title: 'Personalization',
    description: 'Get personalized content based on your usage',
  },
];

export const PrivacySettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { consents, updateConsent, hasConsent, isLoading } = useConsent();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Privacy Settings</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Control how your data is used. You can change these settings at any time.
      </Text>

      {consentOptions.map((option) => (
        <View key={option.type} style={[styles.option, { borderBottomColor: colors.border }]}>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
              {option.description}
            </Text>
          </View>
          <Switch
            value={hasConsent(option.type)}
            onValueChange={(value) => updateConsent(option.type, value)}
            disabled={isLoading}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  option: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1 },
  optionText: { flex: 1, marginRight: 16 },
  optionTitle: { fontSize: 16, fontWeight: '500' },
  optionDesc: { fontSize: 13, marginTop: 4 },
});
```

## Data Retention

```sql
-- Retention policies table
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  data_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic data cleanup function
CREATE OR REPLACE FUNCTION apply_retention_policies()
RETURNS void AS $$
DECLARE
  policy RECORD;
BEGIN
  FOR policy IN SELECT * FROM retention_policies LOOP
    EXECUTE format(
      'DELETE FROM %I WHERE tenant_id = %L AND created_at < NOW() - INTERVAL ''%s days''',
      policy.data_type,
      policy.tenant_id,
      policy.retention_days
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron (Supabase extension)
SELECT cron.schedule('retention-cleanup', '0 2 * * *', 'SELECT apply_retention_policies()');
```

## SOC2 Controls

### Access Logging

```typescript
// Wrap sensitive operations
export const withAccessLogging = <T extends (...args: unknown[]) => Promise<unknown>>(
  operation: string,
  fn: T
): T => {
  return (async (...args: Parameters<T>) => {
    await logAuditEvent({
      action: 'resource.accessed',
      resourceType: operation,
      metadata: { args: JSON.stringify(args) },
    });
    return fn(...args);
  }) as T;
};
```

### Session Management

```typescript
// src/hooks/useSecureSession.ts
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const useSecureSession = () => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastActiveTime = Date.now();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        const elapsed = Date.now() - lastActiveTime;
        if (elapsed > SESSION_TIMEOUT_MS) {
          supabase.auth.signOut();
        }
        lastActiveTime = Date.now();
      } else {
        lastActiveTime = Date.now();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
};
```

## HIPAA Considerations

### PHI Field Encryption

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted PHI storage
CREATE TABLE patient_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  patient_id UUID NOT NULL,
  -- Encrypted fields
  encrypted_data BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encrypt function
CREATE OR REPLACE FUNCTION encrypt_phi(data TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(data, key);
$$ LANGUAGE sql;

-- Decrypt function (use with caution, audit all access)
CREATE OR REPLACE FUNCTION decrypt_phi(data BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(data, key);
$$ LANGUAGE sql;
```

### Access Control for PHI

```typescript
// src/services/phiAccess.ts
import { logAuditEvent, AuditActions } from './auditLog';

export const accessPHI = async <T>(
  patientId: string,
  accessReason: string,
  accessor: () => Promise<T>
): Promise<T> => {
  // Log access attempt
  await logAuditEvent({
    action: AuditActions.VIEWED,
    resourceType: 'patient_record',
    resourceId: patientId,
    metadata: { reason: accessReason },
  });

  return accessor();
};
```

## Compliance Dashboard Component

```typescript
// src/components/ComplianceStatus.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ComplianceCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}

export const ComplianceStatus: React.FC<{ checks: ComplianceCheck[] }> = ({ checks }) => {
  const { colors } = useTheme();

  const statusColors = {
    pass: '#22C55E',
    fail: '#EF4444',
    warning: '#F59E0B',
  };

  return (
    <View style={styles.container}>
      {checks.map((check, index) => (
        <View key={index} style={[styles.check, { borderBottomColor: colors.border }]}>
          <View style={[styles.indicator, { backgroundColor: statusColors[check.status] }]} />
          <View style={styles.content}>
            <Text style={[styles.name, { color: colors.text }]}>{check.name}</Text>
            <Text style={[styles.details, { color: colors.textSecondary }]}>{check.details}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  check: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  indicator: { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 12 },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500' },
  details: { fontSize: 13, marginTop: 2 },
});
```

## Related Patterns

- [Audit Logging](./AUDIT-LOGGING.md)
- [Data Export](./DATA-EXPORT.md)
- [Tenant Isolation](./TENANT-ISOLATION.md)
