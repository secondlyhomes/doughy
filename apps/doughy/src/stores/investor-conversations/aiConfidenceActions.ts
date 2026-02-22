// src/stores/investor-conversations/aiConfidenceActions.ts
// AI confidence settings actions for the investor conversations store

import { supabase } from '@/lib/supabase';
import type { InvestorConversationsState, AIConfidenceRecord } from './types';

type Set = (partial: Partial<InvestorConversationsState> | ((state: InvestorConversationsState) => Partial<InvestorConversationsState>)) => void;
type Get = () => InvestorConversationsState;

export const createAIConfidenceActions = (set: Set, _get: Get) => ({
  fetchAIConfidence: async () => {
    try {
      const { data, error } = await supabase
        .schema('investor')
        .from('ai_confidence_settings')
        .select('*');

      if (error) throw error;

      const confidenceMap: Record<string, AIConfidenceRecord> = {};
      for (const record of (data || []) as AIConfidenceRecord[]) {
        confidenceMap[record.lead_situation] = record;
      }

      set({ aiConfidence: confidenceMap });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch AI confidence';
      set({ error: message });
    }
  },

  toggleAutoSendForSituation: async (leadSituation: string, enabled: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        set({ error: 'Not authenticated' });
        return false;
      }

      const { error } = await supabase
        .schema('investor')
        .from('ai_confidence_settings')
        .upsert({
          user_id: userData.user.id,
          lead_situation: leadSituation,
          auto_send_enabled: enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lead_situation',
        });

      if (error) throw error;

      set((state) => ({
        aiConfidence: {
          ...state.aiConfidence,
          [leadSituation]: {
            ...state.aiConfidence[leadSituation],
            auto_send_enabled: enabled,
          } as AIConfidenceRecord,
        },
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle auto-send';
      set({ error: message });
      return false;
    }
  },
});
