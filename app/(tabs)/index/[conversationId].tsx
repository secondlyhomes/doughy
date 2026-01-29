// app/(tabs)/index/[conversationId].tsx
// Dynamic route for lead conversation detail screen
import { useLocalSearchParams } from 'expo-router';
import { LeadConversationScreen } from '@/features/lead-inbox';

export default function LeadConversationDetailRoute() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  if (!conversationId) {
    return null;
  }

  return <LeadConversationScreen />;
}
