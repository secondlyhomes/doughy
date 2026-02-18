/**
 * WHITE-LABEL PROVIDER
 *
 * Context provider for white-label configuration and theming
 *
 * @example
 * ```tsx
 * <WhiteLabelProvider organizationId="org-123">
 *   <App />
 * </WhiteLabelProvider>
 * ```
 */

import React, { createContext, useEffect, useState, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/services/supabaseClient'
import { DEFAULT_BRANDING, DEFAULT_FEATURES, DEFAULT_URLS, DEFAULT_THEME } from './defaults'
import { createThemeFromConfig } from './hooks/useThemeCustomization'
import type {
  WhiteLabelConfig,
  WhiteLabelContextValue,
  WhiteLabelProviderProps,
} from './types'

const CACHE_KEY = 'white_label_config'

export const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  config: null,
  theme: DEFAULT_THEME,
  loading: true,
  updateConfig: async () => {},
  resetConfig: async () => {},
  previewConfig: () => {},
  clearPreview: () => {},
})

export function WhiteLabelProvider({
  children,
  organizationId,
  fallbackConfig,
}: WhiteLabelProviderProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [previewConfig, setPreviewConfig] = useState<WhiteLabelConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWhiteLabelConfig()
  }, [organizationId])

  async function loadWhiteLabelConfig() {
    try {
      setLoading(true)
      const cached = await loadFromCache()
      if (cached) {
        setConfig(cached)
        setLoading(false)
        loadFromDatabase()
        return
      }
      await loadFromDatabase()
    } catch (error) {
      console.error('Failed to load white label config:', error)
      if (fallbackConfig) {
        setConfig(fallbackConfig)
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadFromCache(): Promise<WhiteLabelConfig | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  async function loadFromDatabase() {
    if (!organizationId) return

    const { data, error } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error loading white label config:', error)
      return
    }

    setConfig(data)
    await saveToCache(data)
  }

  async function saveToCache(configData: WhiteLabelConfig) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(configData))
    } catch (error) {
      console.error('Failed to cache white label config:', error)
    }
  }

  async function updateConfig(updates: Partial<WhiteLabelConfig>) {
    if (!config || !organizationId) return

    const updated = { ...config, ...updates, updated_at: new Date().toISOString() }

    const { error } = await supabase
      .from('white_label_configs')
      .update(updated)
      .eq('organization_id', organizationId)

    if (error) throw error

    setConfig(updated)
    await saveToCache(updated)
  }

  async function resetConfig() {
    if (!organizationId) return

    const defaultConfig: WhiteLabelConfig = {
      id: config?.id || '',
      organization_id: organizationId,
      branding: DEFAULT_BRANDING,
      features: DEFAULT_FEATURES,
      urls: DEFAULT_URLS,
      customization: {},
      created_at: config?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await updateConfig(defaultConfig)
  }

  const theme = useMemo(() => {
    return createThemeFromConfig(previewConfig || config)
  }, [config, previewConfig])

  const value: WhiteLabelContextValue = {
    config: previewConfig || config,
    theme,
    loading,
    updateConfig,
    resetConfig,
    previewConfig: setPreviewConfig,
    clearPreview: () => setPreviewConfig(null),
  }

  return (
    <WhiteLabelContext.Provider value={value}>
      {children}
    </WhiteLabelContext.Provider>
  )
}
