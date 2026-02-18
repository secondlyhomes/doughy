/**
 * useClawSuggestions
 *
 * Fetches and subscribes to AI draft suggestions from claw.draft_suggestions.
 * Falls back gracefully (returns null) if table doesn't exist or Supabase is in mock mode.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase, isMockMode } from '@/services/supabaseClient'
import type { ClawDraft } from '@/components/messages/ClawSuggestionCard'

// Mock draft for dev mode
const MOCK_CLAW_DRAFT: ClawDraft = {
  id: 'draft-1',
  contactId: 'contact-1',
  body: "Hey Mike, I ran those numbers \u2014 I can do $175k cash, close in 3 weeks. Want to talk Thursday?",
  createdAt: new Date().toISOString(),
}

interface UseClawSuggestionsReturn {
  suggestion: ClawDraft | null
  isLoading: boolean
  approve: (id: string) => Promise<void>
  reject: (id: string) => Promise<void>
  dismiss: (id: string) => void
}

export function useClawSuggestions(contactId: string | undefined): UseClawSuggestionsReturn {
  const [suggestion, setSuggestion] = useState<ClawDraft | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!contactId) return

    // Mock mode: show mock draft for contact-1 in dev
    if (isMockMode) {
      if (__DEV__ && contactId === 'contact-1') {
        setSuggestion(MOCK_CLAW_DRAFT)
      } else if (__DEV__) {
        console.log('[useClawSuggestions] mock mode: no draft for', contactId)
      }
      return
    }

    // Live mode: fetch pending suggestion from Supabase
    let cancelled = false

    async function fetchSuggestion() {
      if (!supabase) return
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .schema('claw' as any)
          .from('draft_suggestions')
          .select('id, contact_id, body, created_at')
          .eq('contact_id', contactId!)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error('[useClawSuggestions] query error:', error.message, error.code)
        } else if (!cancelled && data) {
          setSuggestion({
            id: data.id,
            contactId: data.contact_id,
            body: data.body,
            createdAt: data.created_at,
          })
        }
      } catch (err) {
        console.error('[useClawSuggestions] fetch failed:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchSuggestion()

    // Subscribe to realtime changes
    let subscription: any = null
    if (supabase) {
      subscription = supabase
        .channel(`claw-drafts-${contactId}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'claw',
            table: 'draft_suggestions',
            filter: `contact_id=eq.${contactId}`,
          },
          (payload: any) => {
            if (!cancelled && payload.new) {
              setSuggestion({
                id: payload.new.id,
                contactId: payload.new.contact_id,
                body: payload.new.body,
                createdAt: payload.new.created_at,
              })
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[useClawSuggestions] realtime subscription failed:', status)
          }
        })
    }

    return () => {
      cancelled = true
      if (subscription) {
        supabase?.removeChannel(subscription)
      }
    }
  }, [contactId])

  const approve = useCallback(async (id: string) => {
    const prev = suggestion
    setSuggestion(null)
    if (!supabase || isMockMode) return
    try {
      const { error } = await supabase
        .schema('claw' as any)
        .from('draft_suggestions')
        .update({ status: 'approved' })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      setSuggestion(prev)
      console.error('[useClawSuggestions] approve failed:', err)
      throw err
    }
  }, [suggestion])

  const reject = useCallback(async (id: string) => {
    const prev = suggestion
    setSuggestion(null)
    if (!supabase || isMockMode) return
    try {
      const { error } = await supabase
        .schema('claw' as any)
        .from('draft_suggestions')
        .update({ status: 'rejected' })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      setSuggestion(prev)
      console.error('[useClawSuggestions] reject failed:', err)
      throw err
    }
  }, [suggestion])

  const dismiss = useCallback((id: string) => {
    setSuggestion(null)
    // Dismiss is local-only, doesn't update DB
    void id
  }, [])

  return { suggestion, isLoading, approve, reject, dismiss }
}
