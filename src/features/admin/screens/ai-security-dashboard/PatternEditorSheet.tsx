// src/features/admin/screens/ai-security-dashboard/PatternEditorSheet.tsx
// Sheets for managing security patterns (list as BottomSheet, add/edit as FocusedSheet)
// Follows ADHD-friendly design: list view for quick browsing, focused sheet for editing

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  FocusedSheet,
  Button,
  StepUpVerificationSheet,
} from '@/components/ui';
import { useStepUpAuth } from '@/features/auth/hooks';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';

import type { SecurityPattern } from './types';
import { PatternListItem } from './PatternListItem';
import { PatternFormSection } from './PatternFormSection';
import { PatternTestSection } from './PatternTestSection';

interface PatternEditorSheetProps {
  visible: boolean;
  onClose: () => void;
  patterns: SecurityPattern[];
  onPatternsChanged: () => Promise<void>;
}

type EditorMode = 'list' | 'add' | 'edit';

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
              renderItem={({ item }) => (
                <PatternListItem
                  item={item}
                  togglingId={togglingId}
                  onToggleActive={handleToggleActive}
                  onEdit={(editItem) => {
                    setEditingPattern(editItem);
                    setMode('edit');
                  }}
                  onDelete={handleDelete}
                />
              )}
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
        <PatternFormSection
          pattern={pattern}
          onPatternChange={setPattern}
          severity={severity}
          onSeverityChange={setSeverity}
          threatType={threatType}
          onThreatTypeChange={setThreatType}
          description={description}
          onDescriptionChange={setDescription}
        />

        <PatternTestSection
          testInput={testInput}
          onTestInputChange={setTestInput}
          testResult={testResult}
        />
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
