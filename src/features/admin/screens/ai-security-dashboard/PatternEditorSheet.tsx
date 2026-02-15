// src/features/admin/screens/ai-security-dashboard/PatternEditorSheet.tsx
// Sheets for managing security patterns (list as BottomSheet, add/edit as FocusedSheet)
// Follows ADHD-friendly design: list view for quick browsing, focused sheet for editing

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  FocusedSheet,
  FocusedSheetSection,
  Button,
  FormField,
  Select,
  Switch,
  Badge,
  StepUpVerificationSheet,
} from '@/components/ui';
import { useStepUpAuth } from '@/features/auth/hooks';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';

import type { SecurityPattern } from './types';

interface PatternEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  patterns: SecurityPattern[];
  onPatternsChanged: () => Promise<void>;
}

type EditorMode = 'list' | 'add' | 'edit';

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const THREAT_TYPE_OPTIONS = [
  { value: 'prompt_injection', label: 'Prompt Injection' },
  { value: 'jailbreak', label: 'Jailbreak Attempt' },
  { value: 'data_exfiltration', label: 'Data Exfiltration' },
  { value: 'harmful_content', label: 'Harmful Content' },
  { value: 'abuse', label: 'Abuse/Misuse' },
  { value: 'other', label: 'Other' },
];

export function PatternEditorSheet({
  visible,
  onClose,
  patterns,
  onPatternsChanged,
}: PatternEditorSheetProps) {
  const colors = useThemeColors();
  const [mode, setMode] = useState<EditorMode>('list');
  const [editingPattern, setEditingPattern] = useState<SecurityPattern | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Step-up MFA authentication for destructive actions
  const { requireStepUp, verifyStepUp, cancelStepUp, state: stepUpState } = useStepUpAuth();

  // Form state
  const [pattern, setPattern] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [threatType, setThreatType] = useState('prompt_injection');
  const [description, setDescription] = useState('');

  // Test state
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ matches: boolean; error?: string } | null>(null);

  // Reset form when closing or switching modes
  const resetForm = useCallback(() => {
    setPattern('');
    setSeverity('medium');
    setThreatType('prompt_injection');
    setDescription('');
    setTestInput('');
    setTestResult(null);
    setEditingPattern(null);
  }, []);

  // Reset when closing
  useEffect(() => {
    if (!visible) {
      setMode('list');
      resetForm();
    }
  }, [visible, resetForm]);

  // Populate form when editing
  useEffect(() => {
    if (editingPattern) {
      setPattern(editingPattern.pattern || '');
      setSeverity(editingPattern.severity || 'medium');
      setThreatType(editingPattern.threatType || 'prompt_injection');
      setDescription(editingPattern.description || '');
    }
  }, [editingPattern]);

  // Test pattern against input
  const handleTestPattern = useCallback(() => {
    if (!pattern.trim() || !testInput.trim()) {
      setTestResult(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      const matches = regex.test(testInput);
      setTestResult({ matches });
    } catch (err) {
      setTestResult({
        matches: false,
        error: err instanceof Error ? err.message : 'Invalid regex pattern',
      });
    }
  }, [pattern, testInput]);

  // Auto-test when pattern or input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTestPattern();
    }, 300);
    return () => clearTimeout(timer);
  }, [handleTestPattern]);

  // Save pattern
  const handleSave = useCallback(async () => {
    if (!pattern.trim()) {
      Alert.alert('Error', 'Pattern is required');
      return;
    }

    // Validate regex
    try {
      new RegExp(pattern);
    } catch {
      Alert.alert('Error', 'Invalid regex pattern');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPattern) {
        // Update existing
        const { error } = await supabase
          .schema('ai').from('openclaw_blocked_patterns' as unknown as 'profiles')
          .update({
            pattern,
            severity,
            threat_type: threatType,
            description: description.trim() || null,
          })
          .eq('id', editingPattern.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .schema('ai').from('openclaw_blocked_patterns' as unknown as 'profiles')
          .insert({
            pattern,
            severity,
            threat_type: threatType,
            description: description.trim() || null,
            is_active: true,
            hit_count: 0,
          });

        if (error) throw error;
      }

      await onPatternsChanged();
      setMode('list');
      resetForm();
    } catch (err) {
      console.error('[PatternEditorSheet] Error saving pattern:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save pattern');
    } finally {
      setIsSubmitting(false);
    }
  }, [pattern, severity, threatType, description, editingPattern, onPatternsChanged, resetForm]);

  // Toggle pattern active state
  const handleToggleActive = useCallback(
    async (patternItem: SecurityPattern) => {
      setTogglingId(patternItem.id);
      try {
        const { error } = await supabase
          .schema('ai').from('openclaw_blocked_patterns' as unknown as 'profiles')
          .update({ is_active: !patternItem.isActive })
          .eq('id', patternItem.id);

        if (error) throw error;
        await onPatternsChanged();
      } catch (err) {
        console.error('[PatternEditorSheet] Error toggling pattern:', err);
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to toggle pattern');
      } finally {
        setTogglingId(null);
      }
    },
    [onPatternsChanged]
  );

  // Soft-delete pattern (preserves audit trail) - requires step-up MFA
  const handleDelete = useCallback(
    async (patternItem: SecurityPattern) => {
      // Request step-up authentication
      const verified = await requireStepUp({
        reason: 'Delete security pattern',
        actionType: 'pattern_delete',
      });

      if (verified) {
        // Proceed with deletion after MFA verification
        try {
          const { error } = await supabase.rpc('soft_delete_pattern', {
            p_pattern_id: patternItem.id,
          });

          if (error) {
            // Check for "function does not exist" error
            if (error.message?.includes('does not exist')) {
              throw new Error('Pattern archival is not yet available. Please contact support.');
            }
            throw error;
          }
          await onPatternsChanged();
          Alert.alert('Success', 'Pattern has been archived');
        } catch (err) {
          console.error('[PatternEditorSheet] Error archiving pattern:', err);
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to archive pattern');
        }
      }
    },
    [onPatternsChanged, requireStepUp]
  );

  // Handle step-up verification completion
  const handleStepUpVerify = useCallback(
    async (code: string): Promise<boolean> => {
      return verifyStepUp(code);
    },
    [verifyStepUp]
  );

  // Handle step-up cancellation
  const handleStepUpCancel = useCallback(() => {
    cancelStepUp();
  }, [cancelStepUp]);

  const getSeverityColor = (sev: string | undefined | null): string => {
    if (sev === 'critical') return colors.destructive;
    if (sev === 'high') return colors.warning;
    if (sev === 'medium') return '#f59e0b';
    return colors.mutedForeground;
  };

  const formatThreatType = (type: string | undefined | null): string => {
    if (!type) return 'unknown';
    return type.replace(/_/g, ' ');
  };

  const renderPatternItem = ({ item }: { item: SecurityPattern }) => {
    const severityLabel = item.severity || 'unknown';
    const severityColor = getSeverityColor(item.severity);

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: severityColor + '20',
                  borderColor: severityColor,
                  marginRight: 6,
                }}
              >
                <Text style={{ fontSize: 10, color: severityColor, fontWeight: '600' }}>
                  {severityLabel.toUpperCase()}
                </Text>
              </Badge>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {formatThreatType(item.threatType)}
              </Text>
            </View>
            <Text
              style={{ fontSize: 12, color: colors.foreground, fontFamily: 'monospace' }}
              numberOfLines={2}
            >
              {item.pattern}
            </Text>
            {item.description && (
              <Text
                style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            )}
            <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
              {item.hitCount} hits
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {togglingId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive(item)} />
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setEditingPattern(item);
                  setMode('edit');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil" size={ICON_SIZES.md} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={ICON_SIZES.md} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Determine if step-up sheet should be visible
  const showStepUpSheet = stepUpState.isRequired || stepUpState.status === 'mfa_not_configured';

  // List view
  if (mode === 'list') {
    return (
      <>
        <BottomSheet
          visible={visible}
          onClose={onClose}
          title="Security Patterns"
          snapPoints={['85%']}
          scrollable={false}
        >
          <View style={{ flex: 1 }}>
            <Button
              onPress={() => {
                resetForm();
                setMode('add');
              }}
              style={{ marginBottom: SPACING.md }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add" size={ICON_SIZES.ml} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Pattern</Text>
              </View>
            </Button>

            <FlatList
              data={patterns}
              keyExtractor={(item) => item.id}
              renderItem={renderPatternItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons
                    name="shield-outline"
                    size={ICON_SIZES['3xl']}
                    color={colors.mutedForeground}
                  />
                  <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
                    No patterns configured
                  </Text>
                </View>
              }
            />
          </View>
        </BottomSheet>

        {/* Step-up verification sheet for MFA on destructive actions - rendered outside to avoid nesting issues */}
        <StepUpVerificationSheet
          visible={showStepUpSheet}
          onClose={handleStepUpCancel}
          onVerify={handleStepUpVerify}
          state={stepUpState}
        />
      </>
    );
  }

  // Add/Edit view - uses FocusedSheet for better concentration on complex form
  return (
    <>
      <FocusedSheet
        visible={visible}
        onClose={() => {
          setMode('list');
          resetForm();
        }}
        title={mode === 'add' ? 'Add Pattern' : 'Edit Pattern'}
        subtitle="Define regex pattern for threat detection"
        doneLabel={mode === 'add' ? 'Add Pattern' : 'Save Changes'}
        onDone={handleSave}
        doneDisabled={!pattern.trim()}
        isSubmitting={isSubmitting}
      >
        <FocusedSheetSection title="Pattern Details">
          <FormField
            label="Regex Pattern"
            required
            value={pattern}
            onChangeText={setPattern}
            placeholder="e\.g\. (ignore|forget).*instructions"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ fontFamily: 'monospace' }}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.foreground,
                  marginBottom: 6,
                }}
              >
                Severity *
              </Text>
              <Select value={severity} onValueChange={setSeverity} options={SEVERITY_OPTIONS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: colors.foreground,
                  marginBottom: 6,
                }}
              >
                Threat Type *
              </Text>
              <Select
                value={threatType}
                onValueChange={setThreatType}
                options={THREAT_TYPE_OPTIONS}
              />
            </View>
          </View>

          <View style={{ marginTop: SPACING.md }}>
            <FormField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of what this pattern detects"
            />
          </View>
        </FocusedSheetSection>

        <FocusedSheetSection title="Test Pattern">
          <FormField
            label="Test Input"
            value={testInput}
            onChangeText={setTestInput}
            placeholder="Enter text to test against the pattern"
            multiline
            numberOfLines={3}
          />

          {testResult && (
            <View
              style={{
                marginTop: SPACING.sm,
                padding: 12,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: testResult.error
                  ? colors.destructive + '20'
                  : testResult.matches
                    ? colors.success + '20'
                    : colors.muted,
              }}
            >
              {testResult.error ? (
                <Text style={{ color: colors.destructive, fontSize: 13 }}>
                  Error: {testResult.error}
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={testResult.matches ? 'checkmark-circle' : 'close-circle'}
                    size={ICON_SIZES.ml}
                    color={testResult.matches ? colors.success : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: testResult.matches ? colors.success : colors.mutedForeground,
                      fontSize: 13,
                    }}
                  >
                    {testResult.matches ? 'Pattern matches!' : 'No match'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </FocusedSheetSection>
      </FocusedSheet>

      {/* Step-up verification sheet for MFA on destructive actions - rendered outside to avoid nesting issues */}
      <StepUpVerificationSheet
        visible={showStepUpSheet}
        onClose={handleStepUpCancel}
        onVerify={handleStepUpVerify}
        state={stepUpState}
      />
    </>
  );
}
