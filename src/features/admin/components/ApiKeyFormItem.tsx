// src/features/admin/components/ApiKeyFormItem.tsx
// API key form component for React Native
// Adapted from legacy web app

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Eye, EyeOff, Check, X, Edit, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useApiKey } from '@/hooks/useApiKey';
import { useThemeColors, type ThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { validateApiKeyFormat } from '../utils/serviceHelpers';
import type { IntegrationStatus, IntegrationFieldType } from '../types/integrations';

interface ApiKeyFormItemProps {
  service: string;
  label: string;
  type?: IntegrationFieldType;
  required?: boolean;
  options?: string[];
  onSaved?: () => void;
  healthStatus?: IntegrationStatus;
  placeholder?: string;
  description?: string;
}

/**
 * Obfuscate API key while showing useful prefix
 * Examples:
 *   sk-proj-abc123def456 → sk-proj-****
 *   pk_test_123456789 → pk_test_****
 *   AIzaSyD1234567890 → AIzaSy****
 */
function obfuscateKey(key: string): string {
  if (!key || key.length < 8) {
    return '••••••••';
  }

  // Find where to split (after common prefixes or first 6 chars)
  const prefixPatterns = [
    /^(sk-[^-]+-)/,    // OpenAI: sk-proj-, sk-org-
    /^(pk_[^_]+_)/,    // Stripe: pk_test_, pk_live_
    /^(sk_[^_]+_)/,    // Stripe: sk_test_, sk_live_
    /^(rk_[^_]+_)/,    // Stripe: rk_test_, rk_live_
    /^([A-Za-z]{6})/,  // Google: AIzaSy..., first 6 chars
  ];

  for (const pattern of prefixPatterns) {
    const match = key.match(pattern);
    if (match) {
      return `${match[1]}****`;
    }
  }

  // Default: show first 4 chars + asterisks
  return `${key.substring(0, 4)}****`;
}

export function ApiKeyFormItem({
  service,
  label,
  type = 'password',
  required = false,
  options = [],
  onSaved,
  healthStatus,
  placeholder,
  description,
}: ApiKeyFormItemProps) {
  const colors = useThemeColors();
  const [inputValue, setInputValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { key, setKey, save, deleteKey, loading, isSaving } = useApiKey(service);
  const [hasWarning, setHasWarning] = useState(false);

  const initializedRef = useRef(false);

  // Initialize state when component mounts and key data is loaded
  useEffect(() => {
    if (loading) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      // Only enter edit mode if no key exists
      if (!key) {
        setIsEditing(true);
      }
    }
  }, [key, loading]);

  // Update warning status based on health
  useEffect(() => {
    if (healthStatus === 'error') {
      setHasWarning(true);
    } else {
      setHasWarning(false);
    }
  }, [healthStatus]);

  // Handle save
  const handleSave = async () => {
    if (!inputValue) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    // Validate with flexible validation
    const validation = validateApiKeyFormat(inputValue, service);

    // Show warning if needed
    if (validation.warning) {
      setHasWarning(true);
      Alert.alert('Warning', validation.warning + '. You can still save this key, but it may not work correctly.');
    } else {
      setHasWarning(false);
    }

    // Block only if completely invalid
    if (!validation.isValid) {
      Alert.alert('Error', validation.warning || 'Please enter a valid API key');
      return;
    }

    try {
      const result = await save(inputValue);
      if (result.success) {
        Alert.alert('Success', `${label} saved successfully`);
        setInputValue('');
        setShowValue(false);
        setIsEditing(false);
        onSaved?.();
      } else {
        Alert.alert('Error', result.error || 'Failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    Alert.alert(
      'Delete API Key',
      `Are you sure you want to delete ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              const result = await deleteKey();

              if (result.success) {
                setKey('');
                setIsEditing(true);
                setHasWarning(false);
                initializedRef.current = true;
                Alert.alert('Success', `${label} has been removed`);
                onSaved?.();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting API key:', error);
              Alert.alert('Error', 'Failed to delete the API key. Please try again.');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  // Select component (for model preferences, etc.)
  if (type === 'select' && options.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          <StatusBadge hasKey={!!key} hasWarning={hasWarning} healthStatus={healthStatus} colors={colors} />
        </View>
        {description && (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
        )}
        {/* TODO: Implement select dropdown for React Native */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Select dropdown coming soon
        </Text>
      </View>
    );
  }

  // Text/Password inputs
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <StatusBadge hasKey={!!key} hasWarning={hasWarning} healthStatus={healthStatus} colors={colors} />
      </View>
      {description && (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      )}

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isEditing ? (
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              secureTextEntry={!showValue && type === 'password'}
              placeholder={placeholder || `Enter ${label}`}
              placeholderTextColor={colors.mutedForeground}
              value={inputValue}
              onChangeText={setInputValue}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
          ) : (
            <TextInput
              style={[styles.input, { color: colors.mutedForeground }]}
              value={key ? obfuscateKey(key) : '••••••••'}
              editable={false}
            />
          )}

          {isEditing && type === 'password' && (
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowValue(!showValue)}
              disabled={isSaving}
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
            onPress={handleSave}
            disabled={isSaving || (required && !inputValue)}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Check size={16} color={colors.primaryForeground} />
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.editButton, { borderColor: colors.border }]}
            onPress={() => setIsEditing(true)}
          >
            <Edit size={16} color={colors.foreground} />
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Change</Text>
          </TouchableOpacity>
        )}

        {!!key && (
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border }]}
            onPress={handleDelete}
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
    </View>
  );
}

// Status badge component
function StatusBadge({
  hasKey,
  hasWarning,
  healthStatus,
  colors,
}: {
  hasKey: boolean;
  hasWarning?: boolean;
  healthStatus?: IntegrationStatus;
  colors: ThemeColors;
}) {
  if (healthStatus === 'checking') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.info, 'muted'), borderColor: withOpacity(colors.info, 'strong') }]}>
        <ActivityIndicator size="small" color={colors.info} />
        <Text style={[styles.badgeText, { color: colors.info }]}>Checking</Text>
      </View>
    );
  }

  if (healthStatus === 'error' || hasWarning) {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.warning, 'muted'), borderColor: withOpacity(colors.warning, 'strong') }]}>
        <AlertTriangle size={12} color={colors.warning} />
        <Text style={[styles.badgeText, { color: colors.warning }]}>
          {hasKey ? 'Warning' : 'Error'}
        </Text>
      </View>
    );
  }

  if (healthStatus === 'operational') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.success, 'muted'), borderColor: withOpacity(colors.success, 'strong') }]}>
        <CheckCircle size={12} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>Operational</Text>
      </View>
    );
  }

  if (hasKey || healthStatus === 'configured') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.success, 'muted'), borderColor: withOpacity(colors.success, 'strong') }]}>
        <CheckCircle size={12} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>Configured</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: withOpacity(colors.mutedForeground, 'muted'), borderColor: withOpacity(colors.mutedForeground, 'strong') }]}>
      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>Not Configured</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  required: {
    color: '#ef4444',
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
    height: 40,
  },
  saveButton: {
    minWidth: 80,
  },
  editButton: {
    borderWidth: 1,
    minWidth: 90,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
