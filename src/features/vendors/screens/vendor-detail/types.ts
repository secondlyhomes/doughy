// src/features/vendors/screens/vendor-detail/types.ts
// Types for vendor detail screen

export interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
  onPress?: () => void;
}
