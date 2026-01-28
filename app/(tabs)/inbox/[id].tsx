// app/(tabs)/inbox/[id].tsx
// Dynamic route for conversation detail screen
import { useLocalSearchParams } from 'expo-router';
import { ConversationDetailScreen } from '@/features/rental-inbox';

export default function ConversationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <ConversationDetailScreen conversationId={id} />;
}
