// src/features/contacts/screens/contact-detail/index.ts
// Barrel export for contact detail screen components

export type { InfoRowProps } from './types';
export {
  formatContactType,
  getContactTypeBadgeVariant,
  formatStatus,
  formatSource,
  getScoreColor,
} from './formatters';
export { InfoRow } from './InfoRow';
export { ProfileSection, type ProfileSectionProps } from './ProfileSection';
export { QuickActions, type QuickActionsProps } from './QuickActions';
export { Section, type SectionProps } from './Section';
