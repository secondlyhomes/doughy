# White-Labeling Pattern

> Theme customization per tenant for React Native applications.

## Overview

White-labeling enables tenants to customize the app's appearance with their branding. This pattern covers dynamic theming, logo management, and per-tenant styling in React Native.

## Database Schema

```sql
-- Tenant branding configuration
CREATE TABLE tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  -- Brand identity
  app_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,

  -- Colors
  primary_color TEXT DEFAULT '#007AFF',
  secondary_color TEXT DEFAULT '#5856D6',
  accent_color TEXT DEFAULT '#FF9500',

  -- Text colors
  text_color TEXT DEFAULT '#000000',
  text_secondary_color TEXT DEFAULT '#6B7280',

  -- Background colors
  background_color TEXT DEFAULT '#FFFFFF',
  surface_color TEXT DEFAULT '#F3F4F6',

  -- Typography
  font_family TEXT DEFAULT 'System',
  heading_font_family TEXT,

  -- Custom CSS/styles
  custom_styles JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their tenant branding"
  ON tenant_branding FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage branding"
  ON tenant_branding FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      JOIN roles r ON r.id = tm.role_id
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = tenant_branding.tenant_id
        AND r.name = 'admin'
    )
  );
```

## Theme Types

```typescript
// src/types/theme.ts
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

export interface TenantTheme {
  colors: ThemeColors;
  typography: ThemeTypography;
  branding: {
    appName: string;
    logoUrl?: string;
  };
  customStyles: Record<string, unknown>;
}
```

## Dynamic Theme Context

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useTenant } from './TenantContext';
import { TenantTheme, ThemeColors, ThemeTypography } from '@/types/theme';

const defaultColors: ThemeColors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  accent: '#FF9500',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#000000',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

const defaultTypography: ThemeTypography = {
  fontFamily: 'System',
  headingFontFamily: 'System',
  sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 },
};

interface ThemeContextType {
  colors: ThemeColors;
  typography: ThemeTypography;
  branding: { appName: string; logoUrl?: string };
  isDark: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTenant } = useTenant();
  const [theme, setTheme] = useState<TenantTheme | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadTenantTheme();
    }
  }, [currentTenant]);

  const loadTenantTheme = async () => {
    const { data } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', currentTenant!.id)
      .single();

    if (data) {
      setTheme({
        colors: {
          ...defaultColors,
          primary: data.primary_color || defaultColors.primary,
          secondary: data.secondary_color || defaultColors.secondary,
          accent: data.accent_color || defaultColors.accent,
          background: data.background_color || defaultColors.background,
          surface: data.surface_color || defaultColors.surface,
          text: data.text_color || defaultColors.text,
          textSecondary: data.text_secondary_color || defaultColors.textSecondary,
        },
        typography: {
          ...defaultTypography,
          fontFamily: data.font_family || defaultTypography.fontFamily,
          headingFontFamily: data.heading_font_family || defaultTypography.fontFamily,
        },
        branding: {
          appName: data.app_name || 'App',
          logoUrl: data.logo_url,
        },
        customStyles: data.custom_styles || {},
      });
    }
  };

  const toggleDarkMode = () => setIsDark(!isDark);

  const contextValue = {
    colors: theme?.colors || defaultColors,
    typography: theme?.typography || defaultTypography,
    branding: theme?.branding || { appName: 'App' },
    isDark,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

## Themed Components

```typescript
// src/components/ThemedButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
  disabled?: boolean;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
  disabled,
}) => {
  const { colors, typography } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => ({
    color: variant === 'outline' ? colors.primary : '#FFFFFF',
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
  });

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, getTextStyle()]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  text: { fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
```

## Brand Logo Component

```typescript
// src/components/BrandLogo.tsx
import React from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
}

const sizes = { small: 32, medium: 48, large: 72 };

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'medium' }) => {
  const { branding, colors, typography } = useTheme();
  const dimension = sizes[size];

  if (branding.logoUrl) {
    return (
      <Image
        source={{ uri: branding.logoUrl }}
        style={{ width: dimension, height: dimension }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width: dimension, height: dimension, backgroundColor: colors.primary }]}>
      <Text style={[styles.initial, { fontSize: dimension * 0.4, fontFamily: typography.headingFontFamily }]}>
        {branding.appName.charAt(0)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: { borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  initial: { color: '#FFFFFF', fontWeight: 'bold' },
});
```

## Branding Admin Screen

```typescript
// src/screens/branding-admin-screen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/services/supabase';

export const BrandingAdminScreen: React.FC = () => {
  const { colors, typography } = useTheme();
  const { currentTenant } = useTenant();
  const [primaryColor, setPrimaryColor] = useState(colors.primary);
  const [appName, setAppName] = useState('');

  const saveBranding = async () => {
    await supabase
      .from('tenant_branding')
      .upsert({
        tenant_id: currentTenant?.id,
        primary_color: primaryColor,
        app_name: appName,
      });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.headingFontFamily }]}>
        Branding Settings
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>App Name</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={appName}
        onChangeText={setAppName}
        placeholder="Your App Name"
      />

      <Text style={[styles.label, { color: colors.text }]}>Primary Color</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        value={primaryColor}
        onChangeText={setPrimaryColor}
        placeholder="#007AFF"
      />

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={saveBranding}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { marginTop: 32, padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
```

## Implementation Examples

See `.examples/enterprise/white-label-theming/` for a complete theming system with color picker.

## Related Patterns

- [Multi-Tenancy](./MULTI-TENANCY.md)
- [Tenant Isolation](./TENANT-ISOLATION.md)
