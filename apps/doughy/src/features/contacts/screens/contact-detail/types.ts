// src/features/contacts/screens/contact-detail/types.ts
// Types for contact detail screen

export interface InfoRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  onPress?: () => void;
}
