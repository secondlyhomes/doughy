// app/(tabs)/investor-inbox/[id].tsx
// Dynamic route for investor lead conversation detail screen
import { LeadConversationScreen } from '@/features/lead-inbox';

export default function LeadConversationDetailRoute() {
  // The LeadConversationScreen reads the id param internally via useLocalSearchParams
  return <LeadConversationScreen />;
}
