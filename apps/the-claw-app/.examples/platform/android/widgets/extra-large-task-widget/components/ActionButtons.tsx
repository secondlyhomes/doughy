/**
 * ActionButtons Component
 *
 * Displays the primary and secondary action buttons.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ActionButtonsProps } from '../types';
import { LAYOUT, TYPOGRAPHY, BUTTON } from '../styles';

export function ActionButtons({ theme }: ActionButtonsProps) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        marginTop: LAYOUT.gap.large,
        gap: LAYOUT.gap.medium,
      }}
    >
      <FlexWidget
        style={{
          flex: 2,
          paddingVertical: BUTTON.paddingVertical,
          backgroundColor: theme.primary,
          borderRadius: BUTTON.borderRadius,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="ADD_TASK"
      >
        <TextWidget
          text="+ New Task"
          style={{
            fontSize: TYPOGRAPHY.button.fontSize,
            fontWeight: TYPOGRAPHY.button.fontWeight,
            color: theme.onPrimary,
          }}
        />
      </FlexWidget>
      <FlexWidget
        style={{
          flex: 1,
          paddingVertical: BUTTON.paddingVertical,
          backgroundColor: theme.surfaceVariant,
          borderRadius: BUTTON.borderRadius,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="VIEW_ALL"
      >
        <TextWidget
          text="View All"
          style={{
            fontSize: TYPOGRAPHY.button.fontSize,
            fontWeight: TYPOGRAPHY.button.fontWeight,
            color: theme.onSurfaceVariant,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
