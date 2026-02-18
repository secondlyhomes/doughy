/**
 * SmallTaskWidget (1x1)
 *
 * Quick stats display showing completed/total tasks.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetComponentProps } from './types';

export function SmallTaskWidget({ data, theme }: WidgetComponentProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text={`${data.completedCount}`}
        style={{
          fontSize: 36,
          fontWeight: 'bold',
          color: theme.primary,
        }}
      />
      <TextWidget
        text={`/ ${data.totalCount}`}
        style={{
          fontSize: 18,
          color: theme.onSurfaceVariant,
          marginTop: 4,
        }}
      />
      <TextWidget
        text="tasks"
        style={{
          fontSize: 12,
          color: theme.onSurfaceVariant,
          marginTop: 2,
        }}
      />
    </FlexWidget>
  );
}
