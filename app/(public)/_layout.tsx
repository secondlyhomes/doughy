// app/(public)/_layout.tsx
// Layout for public pages (landing, pricing, docs, etc.)
import { Slot } from 'expo-router';
import { PublicLayout } from '@/features/public/components/PublicLayout';

export default function PublicRoutesLayout() {
  return (
    <PublicLayout>
      <Slot />
    </PublicLayout>
  );
}
