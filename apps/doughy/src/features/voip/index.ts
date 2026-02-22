// src/features/voip/index.ts
// VoIP feature exports

// Screens
export { InCallScreen } from './screens/InCallScreen';

// Components (CallControls component — type of same name exported from ./types)
export { CallControls as CallControlsComponent, LiveTranscript, AISuggestions } from './components';

// Hooks
export { useVoipCall, useLiveTranscription, useAISuggestions } from './hooks';

// Store
export { useVoipCallStore } from './stores/voip-call-store';

// Services
export * from './services/twilioService';

// Types (includes CallControls interface)
export * from './types';
