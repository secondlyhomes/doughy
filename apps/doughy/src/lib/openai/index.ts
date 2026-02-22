// src/lib/openai/index.ts
// Barrel export for OpenAI service - maintains backward compatibility

// Re-export types
export type {
  ChatMessage,
  OpenAIResponse,
  AssistantErrorType,
  AssistantResponse,
  ExtractedPropertyData,
  DocumentType,
  ImageExtractionResult,
  DocumentTemplateType,
} from './types';

// Re-export prompts
export { SYSTEM_PROMPTS } from './prompts';

// Re-export assistant functions
export { callPublicAssistant, callDocsAssistant } from './assistant';

// Re-export extraction functions
export {
  extractPropertyData,
  extractFromImage,
  transcribeAudio,
} from './extraction';

// Re-export document generation
export { generateDocument } from './documents';
