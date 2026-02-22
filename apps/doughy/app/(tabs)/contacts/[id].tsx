// app/(tabs)/contacts/[id].tsx
// Contact detail route - displays full contact info with focused view
import { useLocalSearchParams } from 'expo-router';
import { ContactDetailScreen } from '@/features/contacts/screens/ContactDetailScreen';

export default function ContactDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <ContactDetailScreen contactId={id} />;
}
