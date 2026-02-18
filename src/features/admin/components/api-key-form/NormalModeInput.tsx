// src/features/admin/components/api-key-form/NormalModeInput.tsx
// Normal mode UI for API key form (edit, view, test, delete)

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Eye, EyeOff, Check, Edit, RefreshCw, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { obfuscateKey } from './utils';
import { styles } from './styles';
import type { IntegrationFieldType } from './types';

interface NormalModeInputProps {
  currentKey: string;
  inputValue: string;
  showValue: boolean;
  isEditing: boolean;
  isCurrentlySaving: boolean;
  isTesting: boolean;
  deleteLoading: boolean;
  keyExists: boolean;
  required: boolean;
  type: IntegrationFieldType;
  placeholder?: string;
  label: string;
  onInputChange: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onTest: () => void;
  onStartReplace: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

export function NormalModeInput({
  currentKey,
  inputValue,
  showValue,
  isEditing,
  isCurrentlySaving,
  isTesting,
  deleteLoading,
  keyExists,
  required,
  type,
  placeholder,
  label,
  onInputChange,
  onToggleShow,
  onSave,
  onTest,
  onStartReplace,
  onStartEdit,
  onDelete,
}: NormalModeInputProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.inputRow}>
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isEditing ? (
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            secureTextEntry={!showValue && type === 'password'}
            placeholder={placeholder || `Enter ${label}`}
            placeholderTextColor={colors.mutedForeground}
            value={inputValue}
            onChangeText={onInputChange}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCurrentlySaving}
          />
        ) : (
          <TextInput
            style={[styles.input, { color: colors.mutedForeground }]}
            value={currentKey ? obfuscateKey(currentKey) : '••••••••'}
            editable={false}
          />
        )}

        {isEditing && type === 'password' && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={onToggleShow}
            disabled={isCurrentlySaving}
          >
            {showValue ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <TouchableOpacity
          style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={onSave}
          disabled={isCurrentlySaving || (required && !inputValue)}
        >
          {isCurrentlySaving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Check size={16} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <>
          {keyExists && (
            <TouchableOpacity
              style={[styles.button, styles.testButton, { borderColor: colors.border }]}
              onPress={onTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.info} />
              ) : (
                <>
                  <RefreshCw size={14} color={colors.info} />
                  <Text style={[styles.buttonText, { color: colors.info }]}>Test</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {keyExists ? (
            <TouchableOpacity
              style={[styles.button, styles.editButton, { borderColor: colors.border }]}
              onPress={onStartReplace}
            >
              <Edit size={16} color={colors.foreground} />
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Replace</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton, { borderColor: colors.border }]}
              onPress={onStartEdit}
            >
              <Edit size={16} color={colors.foreground} />
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Add</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {keyExists && !isEditing && (
        <TouchableOpacity
          style={[styles.iconButton, { borderColor: colors.border }]}
          onPress={onDelete}
          disabled={deleteLoading}
        >
          {deleteLoading ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <X size={16} color={colors.destructive} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
