// src/features/admin/components/ApiKeyFormItem.tsx
// API key form component for React Native
// Adapted from legacy web app

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useToast } from '@/components/ui/Toast';
import { Eye, EyeOff, Check, X, Edit, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { useApiKey } from '@/hooks/useApiKey';
import { useThemeColors, type ThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { validateApiKeyFormat } from '../utils/serviceHelpers';
import { clearHealthCache, checkIntegrationHealth, testApiKeyWithoutSaving } from '../services/apiKeyHealthService';
import type { IntegrationStatus, IntegrationFieldType, IntegrationHealth } from '../types/integrations';

interface ApiKeyFormItemProps {
  service: string;
  label: string;
  type?: IntegrationFieldType;
  required?: boolean;
  options?: string[];
  /**
   * Called after save/delete with optional health check result.
   * Pass the result to update parent state directly.
   */
  onSaved?: (healthResult?: IntegrationHealth) => void;
  healthStatus?: IntegrationStatus;
  placeholder?: string;
  description?: string;
  /**
   * When true, defers loading the API key until user interacts with the field.
   * This improves performance when many fields mount at once inside an accordion.
   * @default true
   */
  deferLoad?: boolean;
}

/**
 * Trigger haptic feedback
 */
async function triggerHaptic(type: 'success' | 'error' | 'light' = 'light') {
  try {
    const Haptics = await import('expo-haptics');
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptics not available or failed - not critical for app function
    if (__DEV__) {
      console.debug('[Haptics] Not available:', error);
    }
  }
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
  deferLoad = true,
}: ApiKeyFormItemProps) {
  const colors = useThemeColors();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false); // Replace mode: test new key before replacing
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false); // Local save loading for immediate feedback
  const { key, keyExistsInDB, setKey, save, deleteKey, loading, isSaving, loadKey, hasLoaded } = useApiKey(service, { deferLoad });
  const [hasWarning, setHasWarning] = useState(false);

  // Health test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<IntegrationHealth | null>(null);

  // Combined saving state for immediate UI feedback
  const isCurrentlySaving = isSaveLoading || isSaving;

  const initializedRef = useRef(false);

  // Initialize state when component mounts and key data is loaded
  useEffect(() => {
    // Wait for loading to complete (and for deferred load to happen)
    if (loading || (deferLoad && !hasLoaded)) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      // Only enter edit mode if no key exists
      if (!key) {
        setIsEditing(true);
      }
    }
  }, [key, loading, deferLoad, hasLoaded]);

  // Helper to ensure key is loaded before an action
  const ensureKeyLoaded = useCallback(async () => {
    if (deferLoad && !hasLoaded) {
      await loadKey();
    }
  }, [deferLoad, hasLoaded, loadKey]);

  // Update warning status based on health
  useEffect(() => {
    if (healthStatus === 'error') {
      setHasWarning(true);
    } else {
      setHasWarning(false);
    }
  }, [healthStatus]);

  // Handle save - memoized to prevent unnecessary re-renders
  const handleSave = useCallback(async () => {
    if (!inputValue) {
      toast({ type: 'error', title: 'Missing Value', description: 'Please enter a value' });
      return;
    }

    // Set loading immediately for instant feedback
    setIsSaveLoading(true);

    // CRITICAL: Force React to render the spinner before PBKDF2 blocks the thread
    // Double RAF ensures the frame is painted before we start CPU-intensive encryption
    // Includes timeout fallback in case RAF never fires (e.g., app backgrounded)
    await new Promise<void>(resolve => {
      const timeoutId = setTimeout(resolve, 100);
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            clearTimeout(timeoutId);
            resolve();
          });
        });
      } else {
        clearTimeout(timeoutId);
        resolve();
      }
    });

    // Validate with flexible validation (validation is fast, done after spinner shows)
    const validation = validateApiKeyFormat(inputValue, service);

    // Show warning if needed
    if (validation.warning) {
      setHasWarning(true);
      toast({ type: 'warning', title: 'Warning', description: validation.warning, duration: 6000 });
    } else {
      setHasWarning(false);
    }

    // Block only if completely invalid
    if (!validation.isValid) {
      setIsSaveLoading(false);
      toast({ type: 'error', title: 'Invalid Key', description: validation.warning || 'Please enter a valid API key' });
      return;
    }

    try {
      // Show progress toast before the save call (encryption can take 1-2 seconds)
      toast({ type: 'info', title: 'Saving...', description: 'Encrypting and saving your API key' });

      const result = await save(inputValue);
      if (result.success) {
        triggerHaptic('success');
        toast({ type: 'success', title: 'Saved', description: `${label} configured` });
        setInputValue('');
        setShowValue(false);
        setIsEditing(false);

        // Clear health cache and verify the key works
        clearHealthCache(service);
        setIsTesting(true);
        setTestResult(null);

        // Run health check to verify the saved key
        let healthResult: IntegrationHealth | undefined;
        try {
          healthResult = await checkIntegrationHealth(service, true);
          setTestResult(healthResult);

          if (healthResult.status === 'error') {
            toast({
              type: 'warning',
              title: 'Key Saved',
              description: `Saved but verification failed: ${healthResult.message}`,
              duration: 6000,
            });
          }
        } catch (healthError) {
          console.error('Health check after save failed:', healthError);
        } finally {
          setIsTesting(false);
        }

        // Pass health result to parent so it can update its state directly
        onSaved?.(healthResult);
      } else {
        triggerHaptic('error');
        toast({ type: 'error', title: 'Save Failed', description: result.error || 'Please try again', duration: 6000 });
      }
    } catch (error) {
      triggerHaptic('error');
      console.error('Error saving API key:', error);
      toast({ type: 'error', title: 'Error', description: 'An unexpected error occurred', duration: 6000 });
    } finally {
      setIsSaveLoading(false);
    }
  }, [inputValue, service, label, save, toast, onSaved]);

  // Handle delete - memoized to prevent unnecessary re-renders
  const handleDelete = useCallback(() => {
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
                triggerHaptic('success');
                setKey('');
                setIsEditing(true);
                setHasWarning(false);
                initializedRef.current = true;
                setTestResult(null);
                // Clear health cache so status refreshes immediately
                clearHealthCache(service);
                toast({ type: 'success', title: 'Deleted', description: `${label} has been removed` });
                // Pass not-configured status to parent
                onSaved?.({
                  name: label,
                  service,
                  status: 'not-configured',
                  lastChecked: new Date(),
                });
              } else {
                triggerHaptic('error');
                toast({ type: 'error', title: 'Delete Failed', description: result.error || 'Please try again', duration: 6000 });
              }
            } catch (error) {
              triggerHaptic('error');
              console.error('Error deleting API key:', error);
              toast({ type: 'error', title: 'Error', description: 'Failed to delete the API key', duration: 6000 });
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  }, [label, service, deleteKey, setKey, toast, onSaved]);

  // Handle test connection - memoized to prevent unnecessary re-renders
  const handleTest = useCallback(async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      // Ensure key is loaded first (for deferred loading)
      await ensureKeyLoaded();
      // Clear cache to force fresh check
      clearHealthCache(service);
      const result = await checkIntegrationHealth(service, true);
      setTestResult(result);

      if (result.status === 'operational') {
        triggerHaptic('success');
        toast({
          type: 'success',
          title: 'Connection Successful',
          description: result.latency ? `Response time: ${result.latency}` : 'API is reachable',
        });
      } else if (result.status === 'error') {
        triggerHaptic('error');
        toast({
          type: 'error',
          title: 'Connection Failed',
          description: result.message || 'Could not connect to the API',
          duration: 6000,
        });
      }

      // Pass result to parent to update status
      onSaved?.(result);
    } catch (error) {
      triggerHaptic('error');
      console.error('Error testing connection:', error);
      toast({
        type: 'error',
        title: 'Test Failed',
        description: 'Could not test the connection',
        duration: 6000,
      });
    } finally {
      setIsTesting(false);
    }
  }, [service, toast, onSaved, ensureKeyLoaded]);

  // Handle replace - test new key BEFORE saving to prevent data loss
  const handleReplace = useCallback(async () => {
    if (!inputValue) {
      toast({ type: 'error', title: 'Missing Value', description: 'Please enter a new key' });
      return;
    }

    // Validate format first
    const validation = validateApiKeyFormat(inputValue, service);
    if (!validation.isValid) {
      toast({ type: 'error', title: 'Invalid Key', description: validation.warning || 'Please enter a valid API key' });
      return;
    }

    try {
      setIsTesting(true);
      // Ensure key is loaded first (for deferred loading)
      await ensureKeyLoaded();
      toast({ type: 'info', title: 'Testing...', description: 'Verifying new key before replacing' });

      // Test the new key WITHOUT saving first
      const testResultData = await testApiKeyWithoutSaving(service, inputValue);

      if (testResultData.status === 'error') {
        // Test failed - DO NOT save, keep the old key
        triggerHaptic('error');
        toast({
          type: 'error',
          title: 'Test Failed',
          description: testResultData.message || 'The new key could not be verified. Your existing key has been preserved.',
          duration: 8000,
        });
        setTestResult(testResultData);
        return;
      }

      // Test passed - now save the new key
      const saveResult = await save(inputValue);
      if (!saveResult.success) {
        toast({ type: 'error', title: 'Save Failed', description: saveResult.error || 'Could not save the new key', duration: 6000 });
        return;
      }

      // Clear cache so status refreshes
      clearHealthCache(service);

      triggerHaptic('success');
      toast({
        type: 'success',
        title: 'Key Replaced',
        description: `${label} updated successfully`,
      });
      setInputValue('');
      setShowValue(false);
      setIsReplacing(false);
      setTestResult(testResultData);
      // Pass result to parent to update status
      onSaved?.(testResultData);
    } catch (error) {
      triggerHaptic('error');
      console.error('Error replacing key:', error);
      toast({
        type: 'error',
        title: 'Replace Failed',
        description: 'Could not replace the key',
        duration: 6000,
      });
    } finally {
      setIsTesting(false);
    }
  }, [inputValue, service, label, save, toast, onSaved, ensureKeyLoaded]);

  // Cancel replace mode - memoized to prevent unnecessary re-renders
  const handleCancelReplace = useCallback(() => {
    setIsReplacing(false);
    setInputValue('');
    setShowValue(false);
  }, []);

  // Get effective status (test result takes precedence)
  const effectiveStatus = isTesting ? 'checking' : (testResult?.status || healthStatus);
  const effectiveMessage = testResult?.message;
  const effectiveLatency = testResult?.latency;

  // Determine if key exists: use local state if loaded, otherwise infer from health status
  // This allows showing correct UI before actually loading/decrypting the key
  const keyExists = hasLoaded ? keyExistsInDB : (healthStatus !== 'not-configured' && healthStatus !== undefined);

  // Show loading state when deferred load is in progress
  const showDeferredLoading = deferLoad && !hasLoaded && loading;

  // Select component (for model preferences, etc.)
  if (type === 'select' && options.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
          </Text>
          <StatusBadge hasKey={!!key} hasWarning={hasWarning} healthStatus={effectiveStatus} loading={loading} colors={colors} />
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
          {label} {required && <Text style={{ color: colors.destructive }}>*</Text>}
        </Text>
        <StatusBadge hasKey={!!key} hasWarning={hasWarning} healthStatus={effectiveStatus} loading={loading} colors={colors} />
      </View>
      {description && (
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      )}

      {/* Replace mode - show current key and new key input */}
      {isReplacing ? (
        <View style={styles.replaceContainer}>
          {/* Current key (read-only) */}
          <View style={styles.currentKeyRow}>
            <Text style={[styles.currentKeyLabel, { color: colors.mutedForeground }]}>Current:</Text>
            <Text style={[styles.currentKeyValue, { color: colors.mutedForeground }]}>
              {key ? obfuscateKey(key) : '••••••••'}
            </Text>
            <View style={[styles.activeIndicator, { backgroundColor: colors.success }]} />
            <Text style={[styles.activeText, { color: colors.success }]}>Active</Text>
          </View>

          {/* New key input */}
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                secureTextEntry={!showValue && type === 'password'}
                placeholder="Enter new key..."
                placeholderTextColor={colors.mutedForeground}
                value={inputValue}
                onChangeText={setInputValue}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isTesting}
              />
              {type === 'password' && (
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowValue(!showValue)}
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
              onPress={handleReplace}
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
              onPress={handleCancelReplace}
              disabled={isTesting}
            >
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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
                editable={!isCurrentlySaving}
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
              onPress={handleSave}
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
              {/* Test button - only show when key exists */}
              {keyExists && (
                <TouchableOpacity
                  style={[styles.button, styles.testButton, { borderColor: colors.border }]}
                  onPress={handleTest}
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
              {/* Replace button - only show when key exists */}
              {keyExists ? (
                <TouchableOpacity
                  style={[styles.button, styles.editButton, { borderColor: colors.border }]}
                  onPress={() => setIsReplacing(true)}
                >
                  <Edit size={16} color={colors.foreground} />
                  <Text style={[styles.buttonText, { color: colors.foreground }]}>Replace</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.editButton, { borderColor: colors.border }]}
                  onPress={() => setIsEditing(true)}
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
      )}

      {/* Inline status info - show latency only (errors shown via toasts) */}
      {!isEditing && keyExists && effectiveLatency && effectiveStatus !== 'error' && (
        <View style={styles.statusInfo}>
          <Text style={[styles.latencyText, { color: colors.mutedForeground }]}>
            Response time: {effectiveLatency}
          </Text>
        </View>
      )}
    </View>
  );
}

// Status badge component - memoized for performance
const StatusBadge = React.memo(function StatusBadge({
  hasKey,
  hasWarning,
  healthStatus,
  loading,
  colors,
}: {
  hasKey: boolean;
  hasWarning?: boolean;
  healthStatus?: IntegrationStatus;
  loading?: boolean;
  colors: ThemeColors;
}) {
  // Show loading state while fetching key data
  if (loading) {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.muted, 'muted'), borderColor: withOpacity(colors.border, 'strong') }]}>
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      </View>
    );
  }

  if (healthStatus === 'checking') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.info, 'muted'), borderColor: withOpacity(colors.info, 'strong') }]}>
        <ActivityIndicator size="small" color={colors.info} />
        <Text style={[styles.badgeText, { color: colors.info }]}>Checking</Text>
      </View>
    );
  }

  // Show Error badge for health check failures
  if (healthStatus === 'error') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.destructive, 'muted'), borderColor: withOpacity(colors.destructive, 'strong') }]}>
        <XCircle size={12} color={colors.destructive} />
        <Text style={[styles.badgeText, { color: colors.destructive }]}>Error</Text>
      </View>
    );
  }

  // Show Warning badge for validation warnings (key saved but has issues)
  if (hasWarning) {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.warning, 'muted'), borderColor: withOpacity(colors.warning, 'strong') }]}>
        <AlertTriangle size={12} color={colors.warning} />
        <Text style={[styles.badgeText, { color: colors.warning }]}>Warning</Text>
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
});

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
  // Note: Required asterisk color now applied inline using colors.destructive
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
  testButton: {
    borderWidth: 1,
    minWidth: 70,
  },
  replaceButton: {
    minWidth: 90,
  },
  replaceContainer: {
    gap: 8,
  },
  currentKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  currentKeyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentKeyValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '500',
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
  statusInfo: {
    marginTop: 8,
  },
  latencyText: {
    fontSize: 11,
  },
});
