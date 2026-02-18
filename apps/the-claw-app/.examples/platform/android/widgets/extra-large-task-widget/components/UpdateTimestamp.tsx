/**
 * UpdateTimestamp Component
 *
 * Displays the last update time at the bottom of the widget.
 */

import React from 'react';
import { TextWidget } from 'react-native-android-widget';
import { UpdateTimestampProps } from '../types';
import { TYPOGRAPHY } from '../styles';

export function UpdateTimestamp({ lastUpdate, theme }: UpdateTimestampProps) {
  return (
    <TextWidget
      text={`Updated ${lastUpdate}`}
      style={{
        fontSize: TYPOGRAPHY.timestamp.fontSize,
        color: theme.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
      }}
    />
  );
}
