// src/features/admin/components/api-key-form/ReplaceModeInput.tsx
// Replace mode UI for API key form

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Eye, EyeOff, Check, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { obfuscateKey } from './utils';
import { styles } from './styles';
import type { IntegrationFieldType } from './types';

interface ReplaceModeInputProps {
  currentKey: string;
  inputValue: string;
  showValue: boolean;
  isTesting: boolean;
  type: IntegrationFieldType;
  onInputChange: (value: string) => void;
  onToggleShow: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export function ReplaceModeInput({
  currentKey,
  inputValue,
  showValue,
  isTesting,
  type,
  onInputChange,
  onToggleShow,
  onReplace,
  onCancel,
}: ReplaceModeInputProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.replaceContainer}>
      <View style={styles.currentKeyRow}>
        <Text style={[styles.currentKeyLabel, { color: colors.mutedForeground }]}>Current:</Text>
        <Text style={[styles.currentKeyValue, { color: colors.mutedForeground }]}>
          {currentKey ? obfuscateKey(currentKey) : '••••••••'}
        </Text>
        <View style={[styles.activeIndicator, { backgroundColor: colors.success }]} />
        <Text style={[styles.activeText, { color: colors.success }]}>Active</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            secureTextEntry={!showValue && type === 'password'}
            placeholder="Enter new key..."
            placeholderTextColor={colors.mutedForeground}
            value={inputValue}
            onChangeText={onInputChange}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isTesting}
          />
          {type === 'password' && (
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={onToggleShow}
              disabled={isTesting}
            >
              {showValue ? (
                <EyeOff size={20} color={colors.mutedForeground} />
              ) : (
                <Eye size={20} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.replaceButton, { backgroundColor: colors.primary }]}
          onPress={onReplace}
          disabled={isTesting || !inputValue}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Check size={16} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Replace</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={isTesting}
        >
          <X size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
