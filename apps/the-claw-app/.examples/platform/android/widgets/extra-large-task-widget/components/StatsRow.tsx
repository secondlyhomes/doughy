/**
 * StatsRow Component
 *
 * Displays a row of stat cards showing task counts.
 */

import React from 'react';
import { FlexWidget } from 'react-native-android-widget';
import { StatCard } from '../../components/StatCard';
import { StatsRowProps } from '../types';
import { LAYOUT, COLORS } from '../styles';

export function StatsRow({ totalCount, completedCount, theme }: StatsRowProps) {
  const pendingCount = totalCount - completedCount;

  return (
    <FlexWidget style={{ flexDirection: 'row', gap: LAYOUT.gap.large }}>
      <StatCard
        label="Total"
        value={totalCount}
        color={theme.onSurface}
        theme={theme}
      />
      <StatCard
        label="Done"
        value={completedCount}
        color={theme.primary}
        theme={theme}
      />
      <StatCard
        label="To Do"
        value={pendingCount}
        color={COLORS.warning}
        theme={theme}
      />
    </FlexWidget>
  );
}
