// src/components/ui/StepUpVerificationSheet.tsx
// MFA step-up verification sheet for destructive admin actions

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Shield, AlertTriangle } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { MFACodeInput } from '@/features/auth/components/MFACodeInput';
import type { StepUpState } from '@/features/auth/hooks/useStepUpAuth';

interface StepUpVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<boolean>;
  state: StepUpState;
}

export function StepUpVerificationSheet({
  visible,
  onClose,
  onVerify,
  state,
}: StepUpVerificationSheetProps) {
  const colors = useThemeColors();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get pending request from state (no redundant prop)
  const pendingRequest = state.pendingRequest;

  // Reset code when sheet opens/closes
  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
    }
  }, [visible]);

  // Sync error from state - clear when status changes away from error
  useEffect(() => {
    if (state.error && state.status === 'error') {
      setError(state.error);
    } else if (state.status !== 'error' && state.status !== 'mfa_not_configured') {
      // Clear local error when state is no longer in error status
      setError(null);
    }
  }, [state.error, state.status]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    setError(null);

    try {
      const success = await onVerify(code);

      if (!success) {
        setError(state.error || 'Invalid verification code');
        setCode('');
      }
    } catch (err) {
      console.error('[StepUpVerificationSheet] Verification error:', err);
      setError('Verification failed. Please try again.');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  }, [code, onVerify, state.error]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isVerifying) {
      // handleVerify already has its own error handling
      // This catch is only for truly unexpected errors that escape the try-catch
      handleVerify().catch((err) => {
        console.error('[StepUpVerificationSheet] Unexpected auto-verify error:', err);
      });
    }
  }, [code, isVerifying, handleVerify]);

  const getActionDescription = (): string => {
    if (!pendingRequest) return 'this action';

    const descriptions: Record<string, string> = {
      pattern_delete: 'delete this security pattern',
      pattern_bulk_disable: 'disable multiple security patterns',
      threat_score_reset: "reset this user's threat score",
      threat_score_bulk_reset: 'reset multiple threat scores',
      user_unblock: 'unblock this user',
      circuit_breaker_global_reset: 'reset the global circuit breaker',
    };

    return descriptions[pendingRequest.actionType] || pendingRequest.reason || 'perform this action';
  };

  // Show MFA not configured error state
  if (state.status === 'mfa_not_configured') {
    return (
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title="MFA Required"
        snapPoints={['40%']}
        closeOnBackdropPress={true}
      >
        <View style={{ flex: 1, paddingHorizontal: SPACING.md }}>
          {/* Warning Icon */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: withOpacity(colors.destructive, 0.2),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={32} color={colors.destructive} />
            </View>
          </View>

          {/* Error message */}
          <Text
            style={{
              fontSize: 15,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: SPACING.md,
            }}
          >
            {state.error}
          </Text>

          {/* Actions */}
          <View style={{ marginTop: 'auto', paddingBottom: SPACING.lg }}>
            <Button onPress={onClose} style={{ width: '100%' }}>
              OK
            </Button>
          </View>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Verification Required"
      snapPoints={['50%']}
      closeOnBackdropPress={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: SPACING.md }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: withOpacity(colors.warning, 0.2),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={32} color={colors.warning} />
            </View>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: 15,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: SPACING.xs,
            }}
          >
            Enter your authenticator code to
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: SPACING.lg,
            }}
          >
            {getActionDescription()}
          </Text>

          {/* Security note */}
          <View
            style={{
              backgroundColor: withOpacity(colors.info, 0.1),
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.md,
              marginBottom: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                textAlign: 'center',
              }}
            >
              This action requires additional verification for security. Open your authenticator app
              to view your code.
            </Text>
          </View>

          {/* MFA Code Input */}
          <View style={{ marginBottom: SPACING.md }}>
            <MFACodeInput
              value={code}
              onChange={setCode}
              disabled={isVerifying}
              error={!!error}
              autoFocus={visible}
            />
          </View>

          {/* Error message */}
          {error && (
            <View
              style={{
                backgroundColor: withOpacity(colors.destructive, 0.1),
                borderRadius: BORDER_RADIUS.md,
                padding: SPACING.sm,
                marginBottom: SPACING.md,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: colors.destructive,
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Verifying indicator */}
          {isVerifying && (
            <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedForeground,
                  marginTop: SPACING.xs,
                }}
              >
                Verifying...
              </Text>
            </View>
          )}

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: SPACING.md,
              marginTop: 'auto',
              paddingBottom: SPACING.lg,
            }}
          >
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }} disabled={isVerifying}>
              Cancel
            </Button>
            <Button
              onPress={handleVerify}
              style={{ flex: 1 }}
              disabled={code.length !== 6 || isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
