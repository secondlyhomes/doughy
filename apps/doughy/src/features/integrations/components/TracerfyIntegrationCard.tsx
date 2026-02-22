// src/features/integrations/components/TracerfyIntegrationCard.tsx
// Tracerfy skip tracing integration card

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  Button,
  Card,
  Input,
  FormField,
} from '@/components/ui';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { TracerfyConfig } from '../types';
import { getStatusBadge } from './integration-status-helpers';
import { TracerfySettingsSection } from './TracerfySettingsSection';

interface TracerfyIntegrationCardProps {
  tracerfy: TracerfyConfig | undefined;
  tracerfyApiKey: string;
  setTracerfyApiKey: (key: string) => void;
  showTracerfyKey: boolean;
  setShowTracerfyKey: (show: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onDisconnect: () => void;
  onToggleAutoSkipTrace: (enabled: boolean) => void;
  onToggleAutoMatch: (enabled: boolean) => void;
}

export function TracerfyIntegrationCard({
  tracerfy,
  tracerfyApiKey,
  setTracerfyApiKey,
  showTracerfyKey,
  setShowTracerfyKey,
  isSaving,
  onSave,
  onDisconnect,
  onToggleAutoSkipTrace,
  onToggleAutoMatch,
}: TracerfyIntegrationCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Text style={{ fontSize: 24 }}>🔍</Text>
          </View>
          <View>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
              }}
            >
              Tracerfy
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
              }}
            >
              Skip Tracing
            </Text>
          </View>
        </View>
        {tracerfy && getStatusBadge(tracerfy.status, tracerfy.enabled)}
      </View>

      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: FONT_SIZES.sm,
          marginBottom: SPACING.md,
        }}
      >
        Find contact information for leads and automatically match them to property addresses.
      </Text>

      <FormField label="API Key" className="mb-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              value={tracerfyApiKey}
              onChangeText={setTracerfyApiKey}
              placeholder="Enter Tracerfy API key..."
              secureTextEntry={!showTracerfyKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowTracerfyKey(!showTracerfyKey)}
            className="p-3 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            {showTracerfyKey ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </FormField>

      {/* Tracerfy Settings */}
      {tracerfy?.status === 'connected' && (
        <TracerfySettingsSection
          tracerfy={tracerfy}
          onToggleAutoSkipTrace={onToggleAutoSkipTrace}
          onToggleAutoMatch={onToggleAutoMatch}
        />
      )}

      <View className="flex-row gap-2">
        <Button
          onPress={onSave}
          disabled={isSaving || !tracerfyApiKey.trim()}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : tracerfy?.status === 'connected' ? 'Update' : 'Connect'}
        </Button>
        {tracerfy?.status === 'connected' && (
          <Button
            variant="destructive"
            onPress={onDisconnect}
            disabled={isSaving}
          >
            <Trash2 size={18} color="white" />
          </Button>
        )}
      </View>

      {tracerfy?.error && (
        <View
          className="mt-3 p-3 rounded-lg flex-row items-center gap-2"
          style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
        >
          <AlertCircle size={16} color={colors.destructive} />
          <Text
            style={{
              color: colors.destructive,
              fontSize: FONT_SIZES.sm,
              flex: 1,
            }}
          >
            {tracerfy.error}
          </Text>
        </View>
      )}
    </Card>
  );
}
