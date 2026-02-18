/**
 * ProgressSection Component
 *
 * Displays a progress bar with percentage label.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ProgressSectionProps } from '../types';
import { LAYOUT, TYPOGRAPHY, PROGRESS_BAR } from '../styles';

export function ProgressSection({
  completedCount,
  totalCount,
  theme,
}: ProgressSectionProps) {
  const percentage = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;
  const widthPercent = totalCount > 0
    ? `${(completedCount / totalCount) * 100}%`
    : '0%';

  return (
    <FlexWidget style={{ marginBottom: LAYOUT.sectionMarginBottom }}>
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: LAYOUT.gap.small,
        }}
      >
        <TextWidget
          text="Progress"
          style={{
            fontSize: TYPOGRAPHY.progressLabel.fontSize,
            fontWeight: TYPOGRAPHY.progressLabel.fontWeight,
            color: theme.onSurfaceVariant,
          }}
        />
        <TextWidget
          text={`${percentage}%`}
          style={{
            fontSize: TYPOGRAPHY.progressLabel.fontSize,
            fontWeight: TYPOGRAPHY.progressLabel.fontWeight,
            color: theme.primary,
          }}
        />
      </FlexWidget>
      <FlexWidget
        style={{
          height: PROGRESS_BAR.height,
          backgroundColor: theme.surfaceVariant,
          borderRadius: PROGRESS_BAR.borderRadius,
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            height: '100%',
            width: widthPercent,
            backgroundColor: theme.primary,
            borderRadius: PROGRESS_BAR.borderRadius,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
