// src/features/integrations/components/SeamIntegrationCard.tsx
// Seam smart lock integration card

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
import { SeamConfig } from '../types';
import { getStatusBadge } from './integration-status-helpers';

interface SeamIntegrationCardProps {
  seam: SeamConfig | undefined;
  seamApiKey: string;
  setSeamApiKey: (key: string) => void;
  showSeamKey: boolean;
  setShowSeamKey: (show: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
  onDisconnect: () => void;
}

export function SeamIntegrationCard({
  seam,
  seamApiKey,
  setSeamApiKey,
  showSeamKey,
  setShowSeamKey,
  isSaving,
  onSave,
  onDisconnect,
}: SeamIntegrationCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Text style={{ fontSize: 24 }}>🔐</Text>
          </View>
          <View>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
              }}
            >
              Seam
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
              }}
            >
              Smart Locks (Schlage)
            </Text>
          </View>
        </View>
        {seam && getStatusBadge(seam.status, seam.enabled)}
      </View>

      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: FONT_SIZES.sm,
          marginBottom: SPACING.md,
        }}
      >
        Control smart locks and generate access codes for guests. Currently supporting Schlage locks.
      </Text>

      <FormField label="API Key" className="mb-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              value={seamApiKey}
              onChangeText={setSeamApiKey}
              placeholder="Enter Seam API key..."
              secureTextEntry={!showSeamKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowSeamKey(!showSeamKey)}
            className="p-3 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            {showSeamKey ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </FormField>

      <View className="flex-row gap-2">
        <Button
          onPress={onSave}
          disabled={isSaving || !seamApiKey.trim()}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : seam?.status === 'connected' ? 'Update' : 'Connect'}
        </Button>
        {seam?.status === 'connected' && (
          <Button
            variant="destructive"
            onPress={onDisconnect}
            disabled={isSaving}
          >
            <Trash2 size={18} color="white" />
          </Button>
        )}
      </View>

      {seam?.error && (
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
            {seam.error}
          </Text>
        </View>
      )}
    </Card>
  );
}
