/**
 * useSSOProviderManagement Hook
 *
 * Handles SSO provider CRUD operations (admin only).
 */

import { supabase } from '../../services/supabase'
import type { SSOProvider, CreateProviderParams } from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface SSOProviderManagement {
  createProvider: (params: CreateProviderParams) => Promise<SSOProvider>
  updateProvider: (id: string, updates: Partial<CreateProviderParams>) => Promise<void>
  deleteProvider: (id: string) => Promise<void>
  testProvider: (id: string) => Promise<boolean>
}

// ============================================================================
// HOOK
// ============================================================================

export function useSSOProviderManagement(
  providers: SSOProvider[],
  refreshProviders: () => Promise<void>,
  signInWithSSO: (email: string) => Promise<void>
): SSOProviderManagement {
  const createProvider = async (params: CreateProviderParams): Promise<SSOProvider> => {
    const { data, error: createError } = await supabase
      .from('sso_providers')
      .insert({ ...params, enabled: true })
      .select()
      .single()

    if (createError) throw createError
    await refreshProviders()
    return data
  }

  const updateProvider = async (id: string, updates: Partial<CreateProviderParams>) => {
    const { error: updateError } = await supabase
      .from('sso_providers')
      .update(updates)
      .eq('id', id)

    if (updateError) throw updateError
    await refreshProviders()
  }

  const deleteProvider = async (id: string) => {
    const { error: deleteError } = await supabase
      .from('sso_providers')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError
    await refreshProviders()
  }

  const testProvider = async (id: string): Promise<boolean> => {
    try {
      const provider = providers.find(p => p.id === id)
      if (!provider) return false
      await signInWithSSO('test@' + provider.domain)
      return true
    } catch {
      return false
    }
  }

  return {
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
  }
}
