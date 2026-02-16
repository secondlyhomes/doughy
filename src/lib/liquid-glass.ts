// src/lib/liquid-glass.ts
// Safe loader for @callstack/liquid-glass
//
// The library uses TurboModuleRegistry.getEnforcing() which throws an invariant
// violation at import time if the native binary doesn't include the module.
// This module defers loading via require() so it only executes when the native
// module is actually linked (i.e., in a dev build, not Expo Go).
//
// All consumer code should import from '@/lib/liquid-glass' instead of
// '@callstack/liquid-glass' directly.

import { Platform } from 'react-native';

let _isSupported = false;
let _LiquidGlassView: any = null;
let _LiquidGlassContainerView: any = null;

if (Platform.OS === 'ios') {
  try {
    const lg = require('@callstack/liquid-glass');
    _isSupported = !!lg.isLiquidGlassSupported;
    _LiquidGlassView = lg.LiquidGlassView;
    _LiquidGlassContainerView = lg.LiquidGlassContainerView;
  } catch {
    // Native module not linked — dev build required for liquid glass
  }
}

/** True when liquid glass is available (iOS 26+ with dev build) */
export const isLiquidGlassSupported: boolean = _isSupported;

/** LiquidGlassView component — only non-null when isLiquidGlassSupported is true */
export const LiquidGlassView = _LiquidGlassView;

/** LiquidGlassContainerView component — only non-null when isLiquidGlassSupported is true */
export const LiquidGlassContainerView = _LiquidGlassContainerView;
