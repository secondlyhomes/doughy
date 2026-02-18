# Enterprise Authentication Pattern

> SAML, OIDC, and advanced authentication for React Native apps.

## Overview

Enterprise authentication enables organizations to use their existing identity providers (IdPs) like Azure AD, Okta, or Google Workspace. This pattern covers SAML 2.0 and OpenID Connect (OIDC) integration with Supabase.

## Database Schema

```sql
-- Enterprise identity providers
CREATE TABLE enterprise_idps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('saml', 'oidc')),
  enabled BOOLEAN DEFAULT true,

  -- SAML configuration
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_certificate TEXT,
  saml_attribute_mapping JSONB DEFAULT '{}',

  -- OIDC configuration
  oidc_issuer TEXT,
  oidc_client_id TEXT,
  oidc_client_secret_encrypted TEXT,
  oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],

  -- Domain mapping
  email_domains TEXT[] NOT NULL,

  -- Settings
  auto_provision_users BOOLEAN DEFAULT true,
  default_role_id UUID REFERENCES roles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- IdP-linked user identities
CREATE TABLE user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idp_id UUID REFERENCES enterprise_idps(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  email TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idp_id, external_id)
);

-- RLS policies
ALTER TABLE enterprise_idps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage IdPs"
  ON enterprise_idps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN roles r ON r.id = tm.role_id
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = enterprise_idps.tenant_id
        AND r.name = 'admin'
    )
  );

CREATE POLICY "Users view own identities"
  ON user_identities FOR SELECT
  USING (user_id = auth.uid());
```

## SAML Authentication Service

```typescript
// src/services/samlAuth.ts
import { supabase } from './supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

interface SAMLProvider {
  id: string;
  name: string;
  ssoUrl: string;
}

export const initiateSAMLLogin = async (idpId: string): Promise<void> => {
  const redirectUri = makeRedirectUri({ scheme: 'myapp', path: 'auth/callback' });

  // Get SAML auth URL from Edge Function
  const { data, error } = await supabase.functions.invoke('saml-auth', {
    body: {
      idpId,
      redirectUri,
      action: 'initiate',
    },
  });

  if (error) throw error;

  // Open browser for SAML authentication
  const result = await WebBrowser.openAuthSessionAsync(data.authUrl, redirectUri);

  if (result.type === 'success') {
    await handleSAMLCallback(result.url);
  }
};

const handleSAMLCallback = async (callbackUrl: string): Promise<void> => {
  const url = new URL(callbackUrl);
  const token = url.searchParams.get('token');

  if (token) {
    // Exchange SAML token for Supabase session
    const { data, error } = await supabase.functions.invoke('saml-auth', {
      body: {
        action: 'exchange',
        token,
      },
    });

    if (data?.session) {
      await supabase.auth.setSession(data.session);
    }
  }
};

export const getSAMLProvidersForDomain = async (email: string): Promise<SAMLProvider[]> => {
  const domain = email.split('@')[1];

  const { data } = await supabase
    .from('enterprise_idps')
    .select('id, name, saml_sso_url')
    .eq('type', 'saml')
    .eq('enabled', true)
    .contains('email_domains', [domain]);

  return (data || []).map(idp => ({
    id: idp.id,
    name: idp.name,
    ssoUrl: idp.saml_sso_url,
  }));
};
```

## OIDC Authentication Service

```typescript
// src/services/oidcAuth.ts
import { supabase } from './supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

interface OIDCConfig {
  issuer: string;
  clientId: string;
  scopes: string[];
}

WebBrowser.maybeCompleteAuthSession();

export const initiateOIDCLogin = async (idpId: string): Promise<void> => {
  // Get OIDC config from database
  const { data: idp } = await supabase
    .from('enterprise_idps')
    .select('oidc_issuer, oidc_client_id, oidc_scopes')
    .eq('id', idpId)
    .single();

  if (!idp) throw new Error('IdP not found');

  const discovery = await AuthSession.fetchDiscoveryAsync(idp.oidc_issuer);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'myapp' });

  const request = new AuthSession.AuthRequest({
    clientId: idp.oidc_client_id,
    scopes: idp.oidc_scopes,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type === 'success') {
    await exchangeOIDCCode(idpId, result.params.code, request.codeVerifier!);
  }
};

const exchangeOIDCCode = async (
  idpId: string,
  code: string,
  codeVerifier: string
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('oidc-auth', {
    body: {
      idpId,
      code,
      codeVerifier,
    },
  });

  if (error) throw error;

  if (data?.session) {
    await supabase.auth.setSession(data.session);
  }
};
```

## Enterprise Login Screen

```typescript
// src/screens/enterprise-login-screen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getSAMLProvidersForDomain, initiateSAMLLogin } from '@/services/samlAuth';
import { useTheme } from '@/contexts/ThemeContext';

interface IdPOption {
  id: string;
  name: string;
  type: 'saml' | 'oidc';
}

export const EnterpriseLoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [providers, setProviders] = useState<IdPOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (email.includes('@')) {
      checkEnterpriseProviders();
    } else {
      setProviders([]);
    }
  }, [email]);

  const checkEnterpriseProviders = async () => {
    setIsChecking(true);
    const samlProviders = await getSAMLProvidersForDomain(email);
    setProviders(samlProviders.map(p => ({ ...p, type: 'saml' as const })));
    setIsChecking(false);
  };

  const handleProviderLogin = async (provider: IdPOption) => {
    setIsLoading(true);
    try {
      if (provider.type === 'saml') {
        await initiateSAMLLogin(provider.id);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter your work email to continue
      </Text>

      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        placeholder="work@company.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      {isChecking && (
        <View style={styles.checking}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.checkingText, { color: colors.textSecondary }]}>
            Checking for SSO...
          </Text>
        </View>
      )}

      {providers.length > 0 && (
        <View style={styles.providersSection}>
          <Text style={[styles.providersTitle, { color: colors.text }]}>
            Sign in with your organization
          </Text>
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.providerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleProviderLogin(item)}
                disabled={isLoading}
              >
                <Text style={[styles.providerName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.providerType, { color: colors.textSecondary }]}>
                  {item.type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {providers.length === 0 && email.includes('@') && !isChecking && (
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={() => {/* Navigate to password login */}}
        >
          <Text style={styles.continueButtonText}>Continue with Password</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16 },
  checking: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  checkingText: { marginLeft: 8, fontSize: 14 },
  providersSection: { marginTop: 24 },
  providersTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  providerButton: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  providerName: { fontSize: 16, fontWeight: '500' },
  providerType: { fontSize: 12 },
  continueButton: { marginTop: 24, padding: 16, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

## IdP Configuration Screen

```typescript
// src/screens/idp-config-screen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { supabase } from '@/services/supabase';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';

export const IdPConfigScreen: React.FC = () => {
  const { colors } = useTheme();
  const { currentTenant } = useTenant();
  const [type, setType] = useState<'saml' | 'oidc'>('saml');
  const [name, setName] = useState('');
  const [domains, setDomains] = useState('');
  const [samlEntityId, setSamlEntityId] = useState('');
  const [samlSsoUrl, setSamlSsoUrl] = useState('');
  const [samlCertificate, setSamlCertificate] = useState('');
  const [autoProvision, setAutoProvision] = useState(true);

  const handleSave = async () => {
    const config = {
      tenant_id: currentTenant?.id,
      name,
      type,
      email_domains: domains.split(',').map(d => d.trim()),
      auto_provision_users: autoProvision,
      ...(type === 'saml' && {
        saml_entity_id: samlEntityId,
        saml_sso_url: samlSsoUrl,
        saml_certificate: samlCertificate,
      }),
    };

    await supabase.from('enterprise_idps').insert(config);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Configure Identity Provider</Text>

      <Text style={[styles.label, { color: colors.text }]}>Provider Type</Text>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'saml' && { backgroundColor: colors.primary }]}
          onPress={() => setType('saml')}
        >
          <Text style={[styles.typeText, { color: type === 'saml' ? '#fff' : colors.text }]}>SAML</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'oidc' && { backgroundColor: colors.primary }]}
          onPress={() => setType('oidc')}
        >
          <Text style={[styles.typeText, { color: type === 'oidc' ? '#fff' : colors.text }]}>OIDC</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Company SSO"
      />

      <Text style={[styles.label, { color: colors.text }]}>Email Domains (comma-separated)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={domains}
        onChangeText={setDomains}
        placeholder="company.com, corp.company.com"
      />

      {type === 'saml' && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Entity ID</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={samlEntityId}
            onChangeText={setSamlEntityId}
          />

          <Text style={[styles.label, { color: colors.text }]}>SSO URL</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={samlSsoUrl}
            onChangeText={setSamlSsoUrl}
          />

          <Text style={[styles.label, { color: colors.text }]}>Certificate</Text>
          <TextInput
            style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text }]}
            value={samlCertificate}
            onChangeText={setSamlCertificate}
            multiline
            numberOfLines={4}
          />
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.text }]}>Auto-provision users</Text>
        <Switch value={autoProvision} onValueChange={setAutoProvision} />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Configuration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textarea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#E5E7EB' },
  typeText: { fontWeight: '500' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  saveButton: { marginTop: 32, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

## Session Management

```typescript
// src/hooks/useEnterpriseSession.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { AppState, AppStateStatus } from 'react-native';

interface SessionInfo {
  userId: string;
  idpId?: string;
  expiresAt: Date;
  isEnterprise: boolean;
}

export const useEnterpriseSession = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        updateSessionInfo(session);
      } else {
        setSessionInfo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await updateSessionInfo(session);
    }
  };

  const updateSessionInfo = async (session: Session) => {
    // Check if user has enterprise identity
    const { data: identity } = await supabase
      .from('user_identities')
      .select('idp_id')
      .eq('user_id', session.user.id)
      .single();

    setSessionInfo({
      userId: session.user.id,
      idpId: identity?.idp_id,
      expiresAt: new Date(session.expires_at! * 1000),
      isEnterprise: !!identity,
    });
  };

  return sessionInfo;
};
```

## Implementation Examples

See `.examples/enterprise/enterprise-auth/` for complete SAML and OIDC implementations.

## Related Patterns

- [RBAC](./RBAC.md)
- [Multi-Tenancy](./MULTI-TENANCY.md)
