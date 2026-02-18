/**
 * WidgetHeader Component
 *
 * Displays the widget title and current date.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetHeaderProps } from '../types';
import { TYPOGRAPHY } from '../styles';

/**
 * Formats the current date for display
 */
function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function WidgetHeader({ theme }: WidgetHeaderProps) {
  return (
    <FlexWidget style={{ flexDirection: 'column' }}>
      <TextWidget
        text="Task Manager"
        style={{
          fontSize: TYPOGRAPHY.title.fontSize,
          fontWeight: TYPOGRAPHY.title.fontWeight,
          color: theme.onSurface,
        }}
      />
      <TextWidget
        text={getFormattedDate()}
        style={{
          fontSize: TYPOGRAPHY.subtitle.fontSize,
          color: theme.onSurfaceVariant,
          marginTop: 4,
        }}
      />
    </FlexWidget>
  );
}
