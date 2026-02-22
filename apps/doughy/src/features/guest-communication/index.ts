// src/features/guest-communication/index.ts
// Barrel export for guest communication feature

// Screens
export { GuestTemplatesScreen } from './screens/GuestTemplatesScreen';

// Components
export { GuestMessageSheet } from './components/GuestMessageSheet';

// Hooks
export {
  useGuestTemplates,
  useGuestTemplate,
  useBookingMessages,
  useAutoSendRules,
  useTemplateMutations,
  useMessageMutations,
  useAutoSendRuleMutations,
  guestCommunicationKeys,
} from './hooks/useGuestCommunication';

// Services
export {
  renderTemplate,
  buildVariablesFromContext,
  extractVariables,
  validateVariables,
  getTemplatePreview,
  DEFAULT_TEMPLATES,
} from './services/templateService';

// Types
export * from './types';
