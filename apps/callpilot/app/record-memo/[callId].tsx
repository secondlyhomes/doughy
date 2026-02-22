import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { GlassView } from '@/components/GlassView'
import { VoiceMemoRecorder } from '@/components/memos'

export default function RecordMemoScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: theme.tokens.spacing[4] }}>
        <GlassView intensity="subtle" style={{ flex: 1 }}>
          <VoiceMemoRecorder
            onRecordingComplete={() => router.replace(`/call-summary/${callId}`)}
            onSkip={() => router.back()}
          />
        </GlassView>
      </View>
    </SafeAreaView>
  )
}
