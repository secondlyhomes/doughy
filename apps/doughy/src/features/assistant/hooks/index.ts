// src/features/assistant/hooks/index.ts
// Re-export all assistant hooks

export { useChat, type Message } from './useChat';
export { useAssistantContext, type UseAssistantContextOptions } from './useAssistantContext';
export { useAIJobs, useJobStatus, type UseAIJobsReturn, type UseAIJobsOptions } from './useAIJobs';
export { useApplyPatchSet, validatePatchSet, type UseApplyPatchSetReturn } from './useApplyPatchSet';
