import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from './Text'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: string // Emoji for now (POC)
  style?: ViewStyle
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.tokens.spacing[8],
        },
        style,
      ]}
    >
      {icon && (
        <Text
          style={{
            fontSize: 48,
            lineHeight: 64,
            textAlign: 'center',
            marginBottom: theme.tokens.spacing[4],
          }}
        >
          {icon}
        </Text>
      )}
      <Text variant="h4" align="center">
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginTop: theme.tokens.spacing[2], maxWidth: 280 }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ marginTop: theme.tokens.spacing[6] }}>
          <Button title={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  )
}
