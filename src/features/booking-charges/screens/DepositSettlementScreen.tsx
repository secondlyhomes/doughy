// src/features/booking-charges/screens/DepositSettlementScreen.tsx
// Screen for settling deposit and reviewing all charges

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  DollarSign,
  Check,
  X,
  AlertCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { Button, LoadingSpinner, Badge } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/format';
import {
  useBookingCharges,
  useDepositSettlement,
  useChargeMutations,
  useSettlementMutations,
} from '../hooks/useBookingCharges';
import { ChargeCard } from '../components/ChargeCard';
import type { BookingChargeWithRelations } from '../types';

export function DepositSettlementScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [settlementNotes, setSettlementNotes] = useState('');
  const [depositHeld, setDepositHeld] = useState(0); // Would come from booking data

  const { data: charges, isLoading: chargesLoading } = useBookingCharges(bookingId);
  const { data: settlement, isLoading: settlementLoading } = useDepositSettlement(bookingId);
  const { updateStatus } = useChargeMutations();
  const { createSettlement, settleDeposit, isLoading: settlementMutating } = useSettlementMutations();

  // TODO: Fetch actual deposit amount from booking
  useEffect(() => {
    // Placeholder - would fetch from booking data
    setDepositHeld(500);
  }, [bookingId]);

  const pendingCharges = charges?.filter((c) => c.status === 'pending') || [];
  const approvedCharges = charges?.filter((c) => c.status === 'approved') || [];
  const disputedCharges = charges?.filter((c) => c.status === 'disputed') || [];
  const deductedCharges = charges?.filter((c) => c.status === 'deducted') || [];

  const totalApproved = approvedCharges.reduce((sum, c) => sum + c.amount, 0);
  const totalDeducted = deductedCharges.reduce((sum, c) => sum + c.amount, 0);
  const totalDeductions = totalApproved + totalDeducted;
  const amountToReturn = Math.max(0, depositHeld - totalDeductions);

  const handleApproveCharge = async (charge: BookingChargeWithRelations) => {
    try {
      await updateStatus.mutateAsync({ chargeId: charge.id, status: 'approved' });
    } catch (error) {
      Alert.alert('Error', 'Failed to approve charge');
    }
  };

  const handleDisputeCharge = async (charge: BookingChargeWithRelations) => {
    try {
      await updateStatus.mutateAsync({ chargeId: charge.id, status: 'disputed' });
    } catch (error) {
      Alert.alert('Error', 'Failed to dispute charge');
    }
  };

  const handleSettleDeposit = async () => {
    if (pendingCharges.length > 0) {
      Alert.alert(
        'Pending Charges',
        'Please review all pending charges before settling the deposit.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Settle Deposit',
      `Return ${formatCurrency(amountToReturn)} to guest?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          style: 'default',
          onPress: async () => {
            try {
              // Create settlement if doesn't exist
              let currentSettlement = settlement;
              if (!currentSettlement) {
                currentSettlement = await createSettlement.mutateAsync({
                  bookingId: bookingId!,
                  depositHeld,
                });
              }

              // Complete the settlement
              await settleDeposit.mutateAsync({
                settlementId: currentSettlement.id,
                bookingId: bookingId!,
                notes: settlementNotes || undefined,
              });

              Alert.alert('Success', 'Deposit has been settled', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to settle deposit');
            }
          },
        },
      ]
    );
  };

  const isLoading = chargesLoading || settlementLoading;
  const isSettled = settlement?.status === 'completed';

  if (isLoading) {
    return (
      <ThemedView className="flex-1">
        <LoadingSpinner fullScreen />
      </ThemedView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Settle Deposit',
          headerLeft: () => (
            <Button variant="ghost" size="sm" onPress={() => router.back()}>
              <ArrowLeft size={20} color={colors.foreground} />
            </Button>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Settlement Status */}
        {isSettled && (
          <View
            className="mx-4 mt-4 p-4 rounded-lg"
            style={{ backgroundColor: `${colors.success}20` }}
          >
            <View className="flex-row items-center">
              <Check size={20} color={colors.success} />
              <Text className="ml-2 font-semibold" style={{ color: colors.success }}>
                Deposit Settled
              </Text>
            </View>
            <Text className="mt-1 text-sm" style={{ color: colors.success }}>
              {formatCurrency(settlement.amount_returned)} returned to guest on{' '}
              {new Date(settlement.settled_at!).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Summary Card */}
        <View className="m-4 p-4 rounded-lg" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>
            Settlement Summary
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text style={{ color: colors.mutedForeground }}>Security Deposit Held</Text>
            <Text className="font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(depositHeld)}
            </Text>
          </View>

          {totalDeductions > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text style={{ color: colors.mutedForeground }}>Total Deductions</Text>
              <Text className="font-semibold" style={{ color: colors.destructive }}>
                -{formatCurrency(totalDeductions)}
              </Text>
            </View>
          )}

          <View className="border-t pt-3 mt-2" style={{ borderTopColor: colors.border }}>
            <View className="flex-row justify-between">
              <Text className="font-semibold" style={{ color: colors.foreground }}>
                Amount to Return
              </Text>
              <Text className="font-bold text-xl" style={{ color: colors.success }}>
                {formatCurrency(amountToReturn)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Charges - Need Review */}
        {pendingCharges.length > 0 && !isSettled && (
          <View className="mx-4 mb-4">
            <View className="flex-row items-center mb-3">
              <AlertCircle size={16} color={colors.warning} />
              <Text className="ml-2 font-semibold" style={{ color: colors.warning }}>
                Pending Review ({pendingCharges.length})
              </Text>
            </View>

            {pendingCharges.map((charge) => (
              <View key={charge.id} className="mb-3">
                <ChargeCard charge={charge} showLinkedMaintenance />
                <View className="flex-row justify-end mt-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleDisputeCharge(charge)}
                  >
                    <View className="flex-row items-center">
                      <X size={14} color={colors.destructive} />
                      <Text className="ml-1" style={{ color: colors.destructive }}>
                        Dispute
                      </Text>
                    </View>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onPress={() => handleApproveCharge(charge)}
                  >
                    <View className="flex-row items-center">
                      <Check size={14} color={colors.primaryForeground} />
                      <Text className="ml-1" style={{ color: colors.primaryForeground }}>
                        Approve
                      </Text>
                    </View>
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Approved Charges */}
        {approvedCharges.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="font-semibold mb-3" style={{ color: colors.foreground }}>
              Approved Deductions ({approvedCharges.length})
            </Text>
            {approvedCharges.map((charge) => (
              <ChargeCard key={charge.id} charge={charge} showLinkedMaintenance />
            ))}
          </View>
        )}

        {/* Deducted Charges */}
        {deductedCharges.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="font-semibold mb-3" style={{ color: colors.foreground }}>
              Deducted ({deductedCharges.length})
            </Text>
            {deductedCharges.map((charge) => (
              <ChargeCard key={charge.id} charge={charge} showLinkedMaintenance />
            ))}
          </View>
        )}

        {/* Disputed Charges */}
        {disputedCharges.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="font-semibold mb-3" style={{ color: colors.destructive }}>
              Disputed ({disputedCharges.length})
            </Text>
            {disputedCharges.map((charge) => (
              <ChargeCard key={charge.id} charge={charge} showLinkedMaintenance />
            ))}
          </View>
        )}

        {/* Settlement Notes */}
        {!isSettled && (
          <View className="mx-4 mb-4">
            <Text className="font-medium mb-2" style={{ color: colors.foreground }}>
              Settlement Notes
            </Text>
            <TextInput
              className="rounded-lg p-3"
              style={{
                backgroundColor: colors.muted,
                color: colors.foreground,
                minHeight: 80,
              }}
              placeholder="Add any notes about this settlement..."
              placeholderTextColor={colors.mutedForeground}
              value={settlementNotes}
              onChangeText={setSettlementNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Existing Settlement Notes */}
        {settlement?.notes && (
          <View className="mx-4 mb-4">
            <Text className="font-medium mb-2" style={{ color: colors.foreground }}>
              Settlement Notes
            </Text>
            <View className="rounded-lg p-3" style={{ backgroundColor: colors.muted }}>
              <Text style={{ color: colors.foreground }}>{settlement.notes}</Text>
            </View>
          </View>
        )}

        {/* Future: Generate Letter Button */}
        {isSettled && (
          <View className="mx-4 mb-4">
            <Button variant="outline" disabled>
              <View className="flex-row items-center">
                <FileText size={16} color={colors.mutedForeground} />
                <Text className="ml-2" style={{ color: colors.mutedForeground }}>
                  Generate Deduction Letter (Coming Soon)
                </Text>
              </View>
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      {!isSettled && (
        <View className="p-4 border-t" style={{ borderTopColor: colors.border }}>
          <Button
            onPress={handleSettleDeposit}
            loading={settlementMutating}
            disabled={settlementMutating || pendingCharges.length > 0}
            className="w-full"
          >
            {pendingCharges.length > 0
              ? `Review ${pendingCharges.length} Pending Charge${pendingCharges.length > 1 ? 's' : ''}`
              : `Settle Deposit - Return ${formatCurrency(amountToReturn)}`}
          </Button>
        </View>
      )}
    </ThemedSafeAreaView>
  );
}
