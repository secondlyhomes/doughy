/**
 * StatCard Component
 *
 * Displays a single statistic in widget UI.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetTheme } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  theme: WidgetTheme;
}

export function StatCard({ label, value, color, theme }: StatCardProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surfaceVariant,
        borderRadius: 12,
        minWidth: 60,
      }}
    >
      <TextWidget
        text={`${value}`}
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: color,
        }}
      />
      <TextWidget
        text={label}
        style={{
          fontSize: 11,
          color: theme.onSurfaceVariant,
          marginTop: 2,
        }}
      />
    </FlexWidget>
  );
}
