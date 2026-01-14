// src/components/ui/GlassScreenHeader.tsx
// Glass effect header component that overlays content with blur effect
//
// ⚠️ DEPRECATED: This component is no longer used in the main screens.
// The new design applies glass effect directly to SearchBar instead of wrapping entire headers.
// This approach:
// - Eliminates border/edge visibility issues
// - Provides cleaner, more focused glass effect
// - Frees up vertical space by removing redundant titles
//
// See: SearchBar component with glass={true} prop
// Used in: DealsListScreen, PropertyListScreen

import React from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from './GlassView';
import { ScreenHeader, ScreenHeaderProps } from './ScreenHeader';

export interface GlassScreenHeaderProps extends ScreenHeaderProps {
  /** Additional content to display below the header (search, filters, etc.) */
  children?: React.ReactNode;
  /** Blur intensity for the glass effect (0-100). Default: 40 */
  intensity?: number;
  /** Liquid Glass effect type (iOS 26+ only). Default: 'regular' */
  effect?: 'clear' | 'regular';
  /** Callback when the header layout is measured, returns total height */
  onLayout?: (height: number) => void;
}

export function GlassScreenHeader({
  title,
  subtitle,
  backButton,
  onBack,
  rightAction,
  children,
  intensity = 40,
  effect = 'regular',
  onLayout,
}: GlassScreenHeaderProps) {
  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    onLayout?.(height);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <GlassView intensity={intensity} effect={effect} style={styles.glass}>
        <SafeAreaView edges={['top']} style={{ overflow: 'hidden' }}>
          <ScreenHeader
            title={title}
            subtitle={subtitle}
            backButton={backButton}
            onBack={onBack}
            rightAction={rightAction}
            bordered={false}
          />
          {children}
        </SafeAreaView>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  glass: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 0,
    borderRadius: 0,
  },
});
