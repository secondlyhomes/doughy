import { View, TouchableOpacity, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from './Text'

export interface SectionHeaderProps {
  title: string
  actionText?: string
  onAction?: () => void
  style?: ViewStyle
}

export function SectionHeader({ title, actionText, onAction, style }: SectionHeaderProps) {
  const { theme } = useTheme()

  function handleAction() {
    if (onAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onAction()
    }
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.tokens.spacing[4],
          paddingVertical: theme.tokens.spacing[2],
        },
        style,
      ]}
    >
      <Text variant="h5">{title}</Text>
      {actionText && onAction && (
        <TouchableOpacity
          onPress={handleAction}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text
            variant="bodySmall"
            weight="semibold"
            color={theme.colors.primary[500]}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
