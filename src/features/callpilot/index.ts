// CallPilot — Call Intelligence feature module

export { CallHistoryScreen } from './screens/CallHistoryScreen';
export { PreCallScreen } from './screens/PreCallScreen';
export { ActiveCallScreen } from './screens/ActiveCallScreen';
export { PostCallScreen } from './screens/PostCallScreen';
export {
  useCallHistory,
  usePreCallBriefing,
  useActiveCall,
  usePostCallSummary,
  useScriptTemplates,
} from './hooks/useCallPilot';
export type {
  Call,
  PreCallBriefing,
  CoachingCard,
  CallSummary,
  ActionItem,
  ScriptTemplate,
} from './hooks/useCallPilot';
