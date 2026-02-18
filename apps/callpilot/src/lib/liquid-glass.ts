/**
 * Safe loader for @callstack/liquid-glass
 *
 * The library uses TurboModuleRegistry.getEnforcing() which throws an invariant
 * violation at import time if the native binary doesn't include the module.
 * This defers loading via require() so it only executes when the native module
 * is actually linked (i.e., in a dev build, not Expo Go).
 *
 * All consumer code should import from '@/lib/liquid-glass' instead of
 * '@callstack/liquid-glass' directly.
 */

import { Platform } from 'react-native'

let _isSupported = false
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _LiquidGlassView: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _LiquidGlassContainerView: any = null

if (Platform.OS === 'ios') {
  try {
    const lg = require('@callstack/liquid-glass')
    _isSupported = !!lg.isLiquidGlassSupported
    _LiquidGlassView = lg.LiquidGlassView
    _LiquidGlassContainerView = lg.LiquidGlassContainerView
  } catch (err) {
    if (__DEV__) {
      console.warn('[liquid-glass] Module not available:', err instanceof Error ? err.message : err)
    }
  }
}

/** True when liquid glass is available (iOS 26+ with dev build) */
export const isLiquidGlassSupported: boolean = _isSupported

/** LiquidGlassView component — only non-null when isLiquidGlassSupported is true */
export const LiquidGlassView = _LiquidGlassView

/** LiquidGlassContainerView component — only non-null when isLiquidGlassSupported is true */
export const LiquidGlassContainerView = _LiquidGlassContainerView
