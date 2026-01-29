// src/stores/guest-communication-store.ts
// Zustand store for guest communication (templates and messages)

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  GuestMessageTemplate,
  GuestMessage,
  AutoSendRule,
  CreateTemplateInput,
  SendMessageInput,
  GuestTemplateType,
} from '@/features/guest-communication/types';

interface GuestCommunicationState {
  templates: GuestMessageTemplate[];
  messages: GuestMessage[];
  autoSendRules: AutoSendRule[];
  isLoading: boolean;
  error: Error | null;

  // Template actions
  fetchTemplates: (propertyId?: string) => Promise<GuestMessageTemplate[]>;
  fetchTemplateById: (id: string) => Promise<GuestMessageTemplate | null>;
  createTemplate: (input: CreateTemplateInput) => Promise<GuestMessageTemplate>;
  updateTemplate: (id: string, input: Partial<CreateTemplateInput>) => Promise<GuestMessageTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleTemplateActive: (id: string, isActive: boolean) => Promise<void>;

  // Message actions
  fetchMessages: (bookingId: string) => Promise<GuestMessage[]>;
  sendMessage: (input: SendMessageInput) => Promise<GuestMessage>;

  // Auto-send rule actions
  fetchAutoSendRules: () => Promise<AutoSendRule[]>;
  createAutoSendRule: (rule: Omit<AutoSendRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<AutoSendRule>;
  updateAutoSendRule: (id: string, rule: Partial<AutoSendRule>) => Promise<AutoSendRule>;
  deleteAutoSendRule: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useGuestCommunicationStore = create<GuestCommunicationState>((set, get) => ({
  templates: [],
  messages: [],
  autoSendRules: [],
  isLoading: false,
  error: null,

  // ========== Templates ==========

  fetchTemplates: async (propertyId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('guest_message_templates')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (propertyId) {
        // Get property-specific templates OR global templates
        query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const templates = (data || []) as GuestMessageTemplate[];
      set({ templates, isLoading: false });
      return templates;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  fetchTemplateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('guest_message_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as GuestMessageTemplate;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },

  createTemplate: async (input: CreateTemplateInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('guest_message_templates')
        .insert({
          ...input,
          user_id: user.user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const template = data as GuestMessageTemplate;
      set((state) => ({
        templates: [...state.templates, template],
        isLoading: false,
      }));

      return template;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id: string, input: Partial<CreateTemplateInput>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('guest_message_templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const template = data as GuestMessageTemplate;
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? template : t)),
        isLoading: false,
      }));

      return template;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('guest_message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  toggleTemplateActive: async (id: string, isActive: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('guest_message_templates')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, is_active: isActive } : t
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  // ========== Messages ==========

  fetchMessages: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const messages = (data || []) as GuestMessage[];
      set({ messages, isLoading: false });
      return messages;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  sendMessage: async (input: SendMessageInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Insert message record
      const { data, error } = await supabase
        .from('guest_messages')
        .insert({
          user_id: user.user.id,
          template_id: input.template_id,
          booking_id: input.booking_id,
          contact_id: input.contact_id,
          channel: input.channel,
          subject: input.subject,
          body: input.body,
          variables_used: input.variables,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const message = data as GuestMessage;

      // TODO: Call edge function to actually send via Twilio/SendGrid
      // await supabase.functions.invoke('send-guest-message', { body: { messageId: message.id } });

      set((state) => ({
        messages: [message, ...state.messages],
        isLoading: false,
      }));

      return message;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  // ========== Auto-Send Rules ==========

  fetchAutoSendRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('auto_send_rules')
        .select('*')
        .order('trigger', { ascending: true });

      if (error) throw error;

      const rules = (data || []) as AutoSendRule[];
      set({ autoSendRules: rules, isLoading: false });
      return rules;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  createAutoSendRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('auto_send_rules')
        .insert({
          ...rule,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newRule = data as AutoSendRule;
      set((state) => ({
        autoSendRules: [...state.autoSendRules, newRule],
        isLoading: false,
      }));

      return newRule;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateAutoSendRule: async (id: string, rule: Partial<AutoSendRule>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('auto_send_rules')
        .update(rule)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRule = data as AutoSendRule;
      set((state) => ({
        autoSendRules: state.autoSendRules.map((r) =>
          r.id === id ? updatedRule : r
        ),
        isLoading: false,
      }));

      return updatedRule;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  deleteAutoSendRule: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('auto_send_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        autoSendRules: state.autoSendRules.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
