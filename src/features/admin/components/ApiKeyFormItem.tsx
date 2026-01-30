// src/features/admin/components/ApiKeyFormItem.tsx
// API key form component for React Native
// Adapted from legacy web app

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from 'react-native';
import { useApiKey } from '@/hooks/useApiKey';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { IntegrationHealth } from '../types/integrations';
import { KeyAgeIndicator } from './KeyAgeIndicator';
import {
  StatusBadge,
  styles,
  useApiKeyFormHandlers,
  ReplaceModeInput,
  NormalModeInput,
  ApiKeyFormItemProps,
} from './api-key-form';

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
  updatedAt,
  createdAt,
  showAgeIndicator = false,
}: ApiKeyFormItemProps) {
  const colors = useThemeColors();
  const [inputValue, setInputValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
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
    if (loading || (deferLoad && !hasLoaded)) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
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

  // Get handlers from custom hook
  const {
    handleSave,
    handleDelete,
    handleTest,
    handleReplace,
    handleCancelReplace,
  } = useApiKeyFormHandlers({
    service,
    label,
    inputValue,
    setInputValue,
    setShowValue,
    setIsEditing,
    setIsReplacing,
    setIsSaveLoading,
    setDeleteLoading,
    setHasWarning,
    setIsTesting,
    setTestResult,
    setKey,
    save,
    deleteKey,
    onSaved,
    ensureKeyLoaded,
    initializedRef,
  });

  // Get effective status (test result takes precedence)
  const effectiveStatus = isTesting ? 'checking' : (testResult?.status || healthStatus);
  const effectiveLatency = testResult?.latency;

  // Determine if key exists
  const keyExists = hasLoaded ? keyExistsInDB : (healthStatus !== 'not-configured' && healthStatus !== undefined);

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

      {/* Replace mode */}
      {isReplacing ? (
        <ReplaceModeInput
          currentKey={key}
          inputValue={inputValue}
          showValue={showValue}
          isTesting={isTesting}
          type={type}
          onInputChange={setInputValue}
          onToggleShow={() => setShowValue(!showValue)}
          onReplace={handleReplace}
          onCancel={handleCancelReplace}
        />
      ) : (
        <NormalModeInput
          currentKey={key}
          inputValue={inputValue}
          showValue={showValue}
          isEditing={isEditing}
          isCurrentlySaving={isCurrentlySaving}
          isTesting={isTesting}
          deleteLoading={deleteLoading}
          keyExists={keyExists}
          required={required}
          type={type}
          placeholder={placeholder}
          label={label}
          onInputChange={setInputValue}
          onToggleShow={() => setShowValue(!showValue)}
          onSave={handleSave}
          onTest={handleTest}
          onStartReplace={() => setIsReplacing(true)}
          onStartEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
        />
      )}

      {/* Inline status info */}
      {!isEditing && keyExists && effectiveLatency && effectiveStatus !== 'error' && (
        <View style={styles.statusInfo}>
          <Text style={[styles.latencyText, { color: colors.mutedForeground }]}>
            Response time: {effectiveLatency}
          </Text>
        </View>
      )}

      {/* Key age indicator */}
      {!isEditing && keyExists && showAgeIndicator && (updatedAt || createdAt) && (
        <KeyAgeIndicator
          updatedAt={updatedAt ?? null}
          createdAt={createdAt ?? null}
        />
      )}
    </View>
  );
}
