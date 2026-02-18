/**
 * Script Templates Screen
 *
 * List of script templates with ability to view/edit.
 */

import { View, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button, Card, EmptyState } from '@/components'

const MOCK_SCRIPTS = [
  { id: '1', title: 'Cold Call Opener', description: 'Introduction script for first-time outreach', lines: 12 },
  { id: '2', title: 'Renewal Check-in', description: 'Script for existing client renewal conversations', lines: 8 },
  { id: '3', title: 'Objection Handler', description: 'Common objection responses and pivots', lines: 15 },
]

export default function ScriptsScreen() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
        <Button title="Back" variant="text" size="sm" onPress={() => router.back()} />
      </View>

      <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
        <Text variant="h2">Script Templates</Text>
        <Text variant="bodySmall" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[1] }}>
          Manage your call scripts and templates
        </Text>
      </View>

      <FlatList
        data={MOCK_SCRIPTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.tokens.spacing[4],
          paddingTop: theme.tokens.spacing[4],
          paddingBottom: theme.tokens.spacing[8],
          gap: theme.tokens.spacing[3],
        }}
        renderItem={({ item }) => (
          <Card>
            <Text variant="body" weight="semibold">{item.title}</Text>
            <Text variant="caption" color={theme.colors.text.secondary} style={{ marginTop: 2 }}>
              {item.description}
            </Text>
            <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginTop: theme.tokens.spacing[2] }}>
              {item.lines} lines
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No scripts"
            description="Create your first call script template"
            icon="document-text"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}
