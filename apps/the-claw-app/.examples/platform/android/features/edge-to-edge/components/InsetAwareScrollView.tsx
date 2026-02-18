/**
 * InsetAwareScrollView Component
 *
 * ScrollView that automatically handles system insets.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { InsetAwareScrollViewProps } from '../types';

/**
 * ScrollView with automatic inset handling
 *
 * Adds appropriate padding to content based on system insets,
 * ensuring content is not obscured by system bars.
 *
 * @example
 * ```tsx
 * <InsetAwareScrollView contentStyle={{ padding: 16 }}>
 *   <MyScrollableContent />
 * </InsetAwareScrollView>
 * ```
 */
export function InsetAwareScrollView({
  children,
  contentStyle,
}: InsetAwareScrollViewProps) {
  const { insets } = useEdgeToEdge();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
