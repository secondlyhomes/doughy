// src/features/guest-communication/hooks/useGuestCommunication.ts
// React Query hooks for guest communication feature

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGuestCommunicationStore } from '@/stores/guest-communication-store';
import {
  GuestMessageTemplate,
  CreateTemplateInput,
  SendMessageInput,
  AutoSendRule,
} from '../types';

// Query key factory
export const guestCommunicationKeys = {
  all: ['guest-communication'] as const,
  templates: () => [...guestCommunicationKeys.all, 'templates'] as const,
  templateList: (propertyId?: string) => [...guestCommunicationKeys.templates(), { propertyId }] as const,
  template: (id: string) => [...guestCommunicationKeys.templates(), id] as const,
  messages: () => [...guestCommunicationKeys.all, 'messages'] as const,
  messageList: (bookingId: string) => [...guestCommunicationKeys.messages(), { bookingId }] as const,
  autoSendRules: () => [...guestCommunicationKeys.all, 'auto-send-rules'] as const,
};

/**
 * Hook to fetch message templates
 */
export function useGuestTemplates(propertyId?: string) {
  const store = useGuestCommunicationStore();

  return useQuery({
    queryKey: guestCommunicationKeys.templateList(propertyId),
    queryFn: () => store.fetchTemplates(propertyId),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch a single template
 */
export function useGuestTemplate(id: string) {
  const store = useGuestCommunicationStore();

  return useQuery({
    queryKey: guestCommunicationKeys.template(id),
    queryFn: () => store.fetchTemplateById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch messages for a booking
 */
export function useBookingMessages(bookingId: string) {
  const store = useGuestCommunicationStore();

  return useQuery({
    queryKey: guestCommunicationKeys.messageList(bookingId),
    queryFn: () => store.fetchMessages(bookingId),
    enabled: !!bookingId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook to fetch auto-send rules
 */
export function useAutoSendRules() {
  const store = useGuestCommunicationStore();

  return useQuery({
    queryKey: guestCommunicationKeys.autoSendRules(),
    queryFn: () => store.fetchAutoSendRules(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for template mutations
 */
export function useTemplateMutations() {
  const queryClient = useQueryClient();
  const store = useGuestCommunicationStore();

  const createMutation = useMutation({
    mutationFn: (input: CreateTemplateInput) => store.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.templates() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTemplateInput> }) =>
      store.updateTemplate(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.templates() });
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.template(data.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.templates() });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      store.toggleTemplateActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.templates() });
    },
  });

  return {
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    toggleTemplateActive: toggleActiveMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}

/**
 * Hook for sending messages
 */
export function useMessageMutations() {
  const queryClient = useQueryClient();
  const store = useGuestCommunicationStore();

  const sendMutation = useMutation({
    mutationFn: (input: SendMessageInput) => store.sendMessage(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: guestCommunicationKeys.messageList(data.booking_id),
      });
    },
  });

  return {
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
  };
}

/**
 * Hook for auto-send rule mutations
 */
export function useAutoSendRuleMutations() {
  const queryClient = useQueryClient();
  const store = useGuestCommunicationStore();

  const createMutation = useMutation({
    mutationFn: (rule: Omit<AutoSendRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      store.createAutoSendRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.autoSendRules() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: Partial<AutoSendRule> }) =>
      store.updateAutoSendRule(id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.autoSendRules() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteAutoSendRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommunicationKeys.autoSendRules() });
    },
  });

  return {
    createRule: createMutation.mutateAsync,
    updateRule: updateMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
