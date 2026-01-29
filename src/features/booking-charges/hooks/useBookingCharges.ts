// src/features/booking-charges/hooks/useBookingCharges.ts
// React Query hooks for booking charges and deposit settlement

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBookingChargesStore } from '@/stores/booking-charges-store';
import type {
  BookingChargeWithRelations,
  SettlementWithCharges,
  CreateChargeInput,
  UpdateChargeInput,
  BookingChargeStatus,
  SettlementStatus,
  BookingChargesSummary,
} from '../types';

// Query key factory
export const bookingChargesKeys = {
  all: ['booking-charges'] as const,
  byBooking: (bookingId: string) => [...bookingChargesKeys.all, 'booking', bookingId] as const,
  detail: (chargeId: string) => [...bookingChargesKeys.all, 'detail', chargeId] as const,
  settlements: ['settlements'] as const,
  settlementByBooking: (bookingId: string) =>
    [...bookingChargesKeys.settlements, 'booking', bookingId] as const,
  summary: (bookingId: string) => [...bookingChargesKeys.all, 'summary', bookingId] as const,
};

/**
 * Hook to fetch charges for a booking
 */
export function useBookingCharges(bookingId: string | undefined) {
  const store = useBookingChargesStore();

  return useQuery({
    queryKey: bookingChargesKeys.byBooking(bookingId || ''),
    queryFn: () => store.fetchChargesByBooking(bookingId!),
    enabled: !!bookingId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single charge by ID
 */
export function useBookingCharge(chargeId: string | undefined) {
  const store = useBookingChargesStore();

  return useQuery({
    queryKey: bookingChargesKeys.detail(chargeId || ''),
    queryFn: () => store.fetchChargeById(chargeId!),
    enabled: !!chargeId,
  });
}

/**
 * Hook to fetch settlement for a booking
 */
export function useDepositSettlement(bookingId: string | undefined) {
  const store = useBookingChargesStore();

  return useQuery({
    queryKey: bookingChargesKeys.settlementByBooking(bookingId || ''),
    queryFn: () => store.fetchSettlementByBooking(bookingId!),
    enabled: !!bookingId,
  });
}

/**
 * Hook to calculate charges summary for a booking
 */
export function useChargesSummary(bookingId: string | undefined, depositHeld: number = 0) {
  const store = useBookingChargesStore();

  return useQuery({
    queryKey: bookingChargesKeys.summary(bookingId || ''),
    queryFn: () => store.calculateSummary(bookingId!, depositHeld),
    enabled: !!bookingId,
  });
}

/**
 * Mutation hooks for charge operations
 */
export function useChargeMutations() {
  const queryClient = useQueryClient();
  const store = useBookingChargesStore();

  const createCharge = useMutation({
    mutationFn: (input: CreateChargeInput) => store.createCharge(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.byBooking(variables.booking_id),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.summary(variables.booking_id),
      });
    },
  });

  const updateCharge = useMutation({
    mutationFn: ({ chargeId, input }: { chargeId: string; input: UpdateChargeInput }) =>
      store.updateCharge(chargeId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.byBooking(data.booking_id),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.summary(data.booking_id),
      });
    },
  });

  const deleteCharge = useMutation({
    mutationFn: ({ chargeId, bookingId }: { chargeId: string; bookingId: string }) =>
      store.deleteCharge(chargeId).then(() => bookingId),
    onSuccess: (bookingId) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.byBooking(bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.summary(bookingId),
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ chargeId, status }: { chargeId: string; status: BookingChargeStatus }) =>
      store.updateChargeStatus(chargeId, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.byBooking(data.booking_id),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.summary(data.booking_id),
      });
    },
  });

  return {
    createCharge,
    updateCharge,
    deleteCharge,
    updateStatus,
    isLoading:
      createCharge.isPending ||
      updateCharge.isPending ||
      deleteCharge.isPending ||
      updateStatus.isPending,
  };
}

/**
 * Mutation hooks for settlement operations
 */
export function useSettlementMutations() {
  const queryClient = useQueryClient();
  const store = useBookingChargesStore();

  const createSettlement = useMutation({
    mutationFn: ({ bookingId, depositHeld }: { bookingId: string; depositHeld: number }) =>
      store.createSettlement(bookingId, depositHeld),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.settlementByBooking(variables.bookingId),
      });
    },
  });

  const updateSettlementStatus = useMutation({
    mutationFn: ({
      settlementId,
      status,
    }: {
      settlementId: string;
      status: SettlementStatus;
      bookingId: string;
    }) => store.updateSettlementStatus(settlementId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.settlementByBooking(variables.bookingId),
      });
    },
  });

  const settleDeposit = useMutation({
    mutationFn: ({
      settlementId,
      notes,
    }: {
      settlementId: string;
      notes?: string;
      bookingId: string;
    }) => store.settleDeposit(settlementId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.settlementByBooking(variables.bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: bookingChargesKeys.byBooking(variables.bookingId),
      });
    },
  });

  return {
    createSettlement,
    updateSettlementStatus,
    settleDeposit,
    isLoading:
      createSettlement.isPending ||
      updateSettlementStatus.isPending ||
      settleDeposit.isPending,
  };
}

/**
 * Hook to get pending charge count for a booking (for badges)
 */
export function usePendingChargeCount(bookingId: string | undefined) {
  const { data: charges } = useBookingCharges(bookingId);

  return {
    count: charges?.filter((c) => c.status === 'pending').length || 0,
    total: charges?.length || 0,
  };
}
