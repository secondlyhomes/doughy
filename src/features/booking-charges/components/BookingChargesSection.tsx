// src/features/booking-charges/components/BookingChargesSection.tsx
// Section component to display charges on booking detail screen

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, DollarSign, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { Badge, Button } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import { useBookingCharges, useChargesSummary } from '../hooks/useBookingCharges';
import { ChargeCard } from './ChargeCard';
import { AddChargeSheet } from './AddChargeSheet';
import type { BookingChargeWithRelations } from '../types';

interface BookingChargesSectionProps {
  bookingId: string;
  depositHeld?: number;
  propertyId: string;
}

export function BookingChargesSection({
  bookingId,
  depositHeld = 0,
  propertyId,
}: BookingChargesSectionProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const { data: charges, isLoading } = useBookingCharges(bookingId);
  const { data: summary } = useChargesSummary(bookingId, depositHeld);

  const pendingCharges = charges?.filter((c) => c.status === 'pending') || [];
  const approvedCharges = charges?.filter(
    (c) => c.status === 'approved' || c.status === 'deducted'
  ) || [];

  const handleChargePress = (charge: BookingChargeWithRelations) => {
    // Navigate to charge detail (could open a sheet or navigate)
    // For now, we'll keep it simple
  };

  const handleSettleDeposit = () => {
    router.push(`/(tabs)/bookings/${bookingId}/settlement`);
  };

  if (isLoading) {
    return (
      <View className="p-4">
        <View className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: colors.muted }} />
      </View>
    );
  }

  const hasCharges = charges && charges.length > 0;

  return (
    <View className="p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <DollarSign size={20} color={colors.foreground} />
          <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
            Charges & Deposit
          </Text>
          {pendingCharges.length > 0 && (
            <View className="ml-2">
              <Badge variant="warning" size="sm">
                {pendingCharges.length} pending
              </Badge>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="flex-row items-center px-3 py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}
          onPress={() => setShowAddSheet(true)}
        >
          <Plus size={16} color={colors.primaryForeground} />
          <Text className="ml-1 font-medium" style={{ color: colors.primaryForeground }}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {depositHeld > 0 && (
        <View
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-between mb-3">
            <Text style={{ color: colors.mutedForeground }}>Deposit Held</Text>
            <Text className="font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(depositHeld)}
            </Text>
          </View>

          {summary && summary.approvedCharges > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text style={{ color: colors.mutedForeground }}>Approved Deductions</Text>
              <Text className="font-semibold" style={{ color: colors.destructive }}>
                -{formatCurrency(summary.approvedCharges)}
              </Text>
            </View>
          )}

          {summary && summary.pendingCharges > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text style={{ color: colors.mutedForeground }}>Pending Review</Text>
              <Text className="font-medium" style={{ color: colors.warning }}>
                {formatCurrency(summary.pendingCharges)}
              </Text>
            </View>
          )}

          <View
            className="border-t pt-3"
            style={{ borderTopColor: colors.border }}
          >
            <View className="flex-row justify-between">
              <Text className="font-medium" style={{ color: colors.foreground }}>
                Amount to Return
              </Text>
              <Text className="font-bold text-lg" style={{ color: colors.success }}>
                {formatCurrency(summary?.amountToReturn || depositHeld)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Charges List */}
      {hasCharges ? (
        <View>
          {/* Pending Charges */}
          {pendingCharges.length > 0 && (
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.mutedForeground }}
              >
                PENDING REVIEW
              </Text>
              {pendingCharges.map((charge) => (
                <ChargeCard
                  key={charge.id}
                  charge={charge}
                  onPress={() => handleChargePress(charge)}
                />
              ))}
            </View>
          )}

          {/* Approved/Deducted Charges */}
          {approvedCharges.length > 0 && (
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.mutedForeground }}
              >
                APPROVED DEDUCTIONS
              </Text>
              {approvedCharges.map((charge) => (
                <ChargeCard
                  key={charge.id}
                  charge={charge}
                  onPress={() => handleChargePress(charge)}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View
          className="rounded-lg p-6 items-center"
          style={{ backgroundColor: colors.card }}
        >
          <DollarSign size={32} color={colors.mutedForeground} />
          <Text
            className="mt-2 text-center"
            style={{ color: colors.mutedForeground }}
          >
            No charges recorded
          </Text>
          <Text
            className="text-sm text-center mt-1"
            style={{ color: colors.mutedForeground }}
          >
            Add charges for damages, cleaning, or other deductions
          </Text>
        </View>
      )}

      {/* Settle Deposit Button */}
      {depositHeld > 0 && hasCharges && (
        <Button
          variant="outline"
          onPress={handleSettleDeposit}
          className="mt-4"
        >
          <View className="flex-row items-center">
            <Text style={{ color: colors.foreground }}>Settle Deposit</Text>
            <ChevronRight size={16} color={colors.foreground} className="ml-1" />
          </View>
        </Button>
      )}

      {/* Add Charge Sheet */}
      <AddChargeSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        bookingId={bookingId}
      />
    </View>
  );
}
