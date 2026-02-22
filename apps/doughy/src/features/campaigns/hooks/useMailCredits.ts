// src/features/campaigns/hooks/useMailCredits.ts
// React Query hooks for mail credits management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  MailCredits,
  MailCreditTransaction,
  CreditPackage,
} from '../types';

// =============================================================================
// Query Keys
// =============================================================================

export const mailCreditKeys = {
  all: ['mail-credits'] as const,
  balance: (userId: string) => [...mailCreditKeys.all, 'balance', userId] as const,
  transactions: (userId: string) => [...mailCreditKeys.all, 'transactions', userId] as const,
  packages: () => [...mailCreditKeys.all, 'packages'] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch user's mail credit balance
 */
export function useMailCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mailCreditKeys.balance(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_mail_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no record exists, return default
      if (error?.code === 'PGRST116') {
        return {
          id: '',
          user_id: user.id,
          balance: 0,
          lifetime_purchased: 0,
          lifetime_used: 0,
          reserved: 0,
          low_balance_threshold: 50,
        } as MailCredits;
      }

      if (error) throw error;
      return data as unknown as MailCredits;
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch user's credit transactions
 */
export function useMailCreditTransactions(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: mailCreditKeys.transactions(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('mail_credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as MailCreditTransaction[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch available credit packages
 */
export function useCreditPackages() {
  const { session } = useAuth();

  return useQuery({
    queryKey: mailCreditKeys.packages(),
    queryFn: async () => {
      if (!session?.access_token) return [];

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/purchase-mail-credits`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Failed to fetch packages`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch packages');
      }

      return data.packages as CreditPackage[];
    },
    enabled: !!session?.access_token,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Purchase mail credits
 */
export function usePurchaseCredits() {
  const queryClient = useQueryClient();
  const { session, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      packageId,
      paymentMethodId,
      createCheckout = true,
    }: {
      packageId: string;
      paymentMethodId?: string;
      createCheckout?: boolean;
    }) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/purchase-mail-credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            package_id: packageId,
            payment_method_id: paymentMethodId,
            create_checkout: createCheckout,
            success_url: 'doughy://mail-credits/success',
            cancel_url: 'doughy://mail-credits/cancel',
          }),
        }
      );

      if (!response.ok) {
        // Try to get error from JSON body, but handle parse failures
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMessage = errorData.error;
        } catch {
          // JSON parse failed, use status code message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success && !data.checkout_url) {
        throw new Error(data.error || 'Failed to purchase credits');
      }

      return data;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: mailCreditKeys.balance(user.id) });
        queryClient.invalidateQueries({ queryKey: mailCreditKeys.transactions(user.id) });
      }
    },
  });
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Calculate if user has enough credits for a mail piece
 */
export function useHasEnoughCredits(requiredCredits: number) {
  const { data: credits, isLoading } = useMailCredits();

  return {
    hasEnough: (credits?.balance || 0) >= requiredCredits,
    balance: credits?.balance || 0,
    isLoading,
  };
}

/**
 * Format credit balance for display
 */
export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
