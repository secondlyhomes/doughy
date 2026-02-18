/**
 * AI Integration Types
 *
 * Centralized TypeScript types for AI features
 */

// =============================================================================
// Models and Providers
// =============================================================================

export type AIModel =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gpt-4-turbo'
  | 'claude-3.5-sonnet'
  | 'claude-3-haiku'

export type AIProvider = 'openai' | 'anthropic'

export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large'

// =============================================================================
// Messages and Conversations
// =============================================================================

export type MessageRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  model?: AIModel
  tokens?: TokenUsage
  cost?: number
}

export interface Conversation {
  id: string
  userId: string
  title: string
  messages: ChatMessage[]
  model: AIModel
  totalTokens: number
  totalCost: number
  createdAt: string
  updatedAt: string
}

export interface TokenUsage {
  prompt: number
  completion: number
  total: number
}

// =============================================================================
// API Requests and Responses
// =============================================================================

export interface ChatCompletionRequest {
  messages: Array<{
    role: MessageRole
    content: string
  }>
  model?: AIModel
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  content: string
  model: AIModel
  tokens: TokenUsage
  cost: number
  usage: UsageInfo
}

export interface StreamChunk {
  id: string
  delta: string
  done: boolean
}

export interface EmbeddingRequest {
  text: string
  model?: EmbeddingModel
}

export interface EmbeddingResponse {
  embedding: number[]
  model: string
  tokens: number
  cost: number
}

export interface ModerationRequest {
  text: string
}

export interface ModerationResponse {
  flagged: boolean
  categories: Record<string, boolean>
  categoryScores: Record<string, number>
}

// =============================================================================
// Vector Store and RAG
// =============================================================================

export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface SimilarityResult {
  id: string
  content: string
  metadata?: Record<string, any>
  similarity: number
}

export interface SearchRequest {
  query: string
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
  useHybrid?: boolean
}

export interface SearchResponse {
  results: SimilarityResult[]
  queryCost: number
  totalResults: number
}

export interface RAGChatRequest {
  query: string
  model?: AIModel
  maxContextDocs?: number
  systemPrompt?: string
}

export interface RAGChatResponse {
  content: string
  sources: Array<{
    id: string
    content: string
    similarity: number
  }>
  model: AIModel
  tokens: TokenUsage
  cost: number
  totalCost: number
}

// =============================================================================
// Usage and Cost Tracking
// =============================================================================

export interface UsageInfo {
  remaining: number
  limit: number
}

export interface UsageStats {
  requestsRemaining: number
  requestsLimit: number
  costToday: number
  costMonth: number
  tokensToday: number
  tokensMonth: number
}

export interface UsageEntry {
  id: string
  userId: string
  operationType: 'chat' | 'embedding' | 'moderation' | 'search'
  model: string
  tokensPrompt: number
  tokensCompletion: number
  tokensTotal: number
  cost: number
  latencyMs?: number
  metadata?: Record<string, any>
  createdAt: string
}

export interface UsageStatistics {
  totalRequests: number
  totalTokens: number
  totalCost: number
  byOperation: Record<
    string,
    {
      requests: number
      tokens: number
      cost: number
    }
  >
  byModel: Record<
    string,
    {
      requests: number
      tokens: number
      cost: number
    }
  >
}

// =============================================================================
// Database Types
// =============================================================================

export interface AIConversationRow {
  id: string
  user_id: string
  title: string
  model: string
  messages: any[] // JSONB
  total_tokens: number
  total_cost: number
  created_at: string
  updated_at: string
}

export interface EmbeddingRow {
  id: string
  user_id: string | null
  content: string
  embedding: number[] // vector(1536)
  metadata: Record<string, any> // JSONB
  created_at: string
  updated_at: string
}

export interface AIUsageRow {
  id: string
  user_id: string
  operation_type: string
  model: string
  tokens_prompt: number
  tokens_completion: number
  tokens_total: number
  cost: number
  latency_ms: number | null
  metadata: Record<string, any> // JSONB
  created_at: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface AIProviderProps {
  children: React.ReactNode
  defaultModel?: AIModel
  autoSave?: boolean
}

/**
 * AI Context value interface
 */
export interface AIContextValue {
  conversation: Conversation | null
  conversations: Conversation[]
  loading: boolean
  streaming: boolean
  error: string | null
  usage: UsageStats | null
  model: AIModel
  setModel: (model: AIModel) => void
  createConversation: (title: string, systemPrompt?: string) => Promise<Conversation>
  loadConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<ChatMessage>
  sendMessageStream: (
    content: string,
    onChunk: (chunk: StreamChunk) => void
  ) => Promise<ChatMessage>
  clearConversation: () => void
  refreshUsage: () => Promise<void>
}

export interface RAGProviderProps {
  children: React.ReactNode
  embeddingModel?: EmbeddingModel
}

export interface ChatInterfaceProps {
  systemPrompt?: string
  enableStreaming?: boolean
  showCost?: boolean
  showModelSelector?: boolean
  placeholder?: string
}

export interface AIAssistantProps {
  quickActions?: QuickAction[]
  systemPrompt?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export interface SmartSearchProps {
  placeholder?: string
  enableHybrid?: boolean
  resultsLimit?: number
  similarityThreshold?: number
  showCost?: boolean
  metadataFilter?: Record<string, any>
  onResultSelect?: (result: SimilarityResult) => void
  enableChat?: boolean
}

// =============================================================================
// Utility Types
// =============================================================================

export interface QuickAction {
  id: string
  label: string
  prompt: string
  icon?: string
}

export interface ModelPricing {
  input: number
  output: number
}

export interface CostEstimate {
  min: number
  max: number
}

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export interface ModelRoutingDecision {
  model: AIModel
  tier: 'nano' | 'mini' | 'full'
  reason: string
}

// =============================================================================
// Error Types
// =============================================================================

export class AIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export class RateLimitError extends AIError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
    this.name = 'RateLimitError'
  }
}

export class CostExceededError extends AIError {
  constructor(message: string, public currentCost: number, public limit: number) {
    super(message, 'COST_EXCEEDED', 402)
    this.name = 'CostExceededError'
  }
}

export class ModerationError extends AIError {
  constructor(
    message: string,
    public categories: Record<string, boolean>
  ) {
    super(message, 'CONTENT_FLAGGED', 400)
    this.name = 'ModerationError'
  }
}

// =============================================================================
// Type Guards
// =============================================================================

export function isAIModel(value: unknown): value is AIModel {
  return (
    typeof value === 'string' &&
    ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'claude-3.5-sonnet', 'claude-3-haiku'].includes(value)
  )
}

export function isMessageRole(value: unknown): value is MessageRole {
  return typeof value === 'string' && ['system', 'user', 'assistant'].includes(value)
}

export function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'role' in value &&
    'content' in value &&
    'timestamp' in value
  )
}

export function isConversation(value: unknown): value is Conversation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'messages' in value &&
    Array.isArray((value as any).messages)
  )
}

// =============================================================================
// Constants
// =============================================================================

export const MODEL_PRICING: Record<AIModel, ModelPricing> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
}

export const EMBEDDING_PRICING: Record<EmbeddingModel, number> = {
  'text-embedding-3-small': 0.02, // per 1M tokens
  'text-embedding-3-large': 0.13, // per 1M tokens
}

export const DEFAULT_LIMITS = {
  MAX_INPUT_CHARS: 6000,
  MAX_OUTPUT_TOKENS: 500,
  MAX_OPERATIONS_PER_REQUEST: 20,
  REQUEST_TIMEOUT_MS: 30000,
  RATE_LIMIT_PER_MINUTE: 10,
  RATE_LIMIT_PER_DAY: 300,
  DAILY_COST_LIMIT: 0.5,
} as const

export const COMPLEXITY_KEYWORDS = [
  'except',
  'but not',
  'unless',
  'only if',
  'every day',
  'weekly',
  'daily',
  'recurring',
  'cancel all',
  'delete all',
  'batch',
] as const

export const JAILBREAK_PATTERNS = [
  /ignore.*previous.*instructions/i,
  /you are now/i,
  /pretend you/i,
  /\|im_start\|/i,
  /system.*prompt/i,
] as const
