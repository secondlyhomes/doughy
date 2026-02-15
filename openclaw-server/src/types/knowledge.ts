/**
 * Shared Knowledge Types for OpenClaw Connectors
 *
 * This module contains all shared type definitions used across
 * the knowledge connector system (Fibery, Notion, Discord).
 *
 * @see /docs/moltbot-ecosystem-expansion.md
 */

// =============================================================================
// Chunk Types
// =============================================================================

/**
 * Types of knowledge chunks that can be stored
 */
export type ChunkType =
  | 'property_rule'
  | 'response_example'
  | 'sop'
  | 'faq'
  | 'policy'
  | 'email_template'
  | 'community_insight'
  | 'training_material';

// =============================================================================
// Knowledge Chunk
// =============================================================================

/**
 * Base knowledge chunk without ID (before persistence)
 */
export interface NewKnowledgeChunk {
  id?: undefined;
  sourceId: string;
  userId: string;
  chunkType: ChunkType;
  title?: string;
  content: string;
  externalId: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
  embedding?: number[];
}

/**
 * Persisted knowledge chunk with ID
 */
export interface PersistedKnowledgeChunk {
  id: string;
  sourceId: string;
  userId: string;
  chunkType: ChunkType;
  title?: string;
  content: string;
  externalId: string;
  contentHash: string;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
  embedding?: number[];
}

/**
 * Knowledge chunk - either new or persisted
 */
export type KnowledgeChunk = NewKnowledgeChunk | PersistedKnowledgeChunk;

/**
 * Type guard to check if a chunk has been persisted
 */
export function isPersistedChunk(chunk: KnowledgeChunk): chunk is PersistedKnowledgeChunk {
  return typeof chunk.id === 'string' && chunk.id.length > 0;
}

// =============================================================================
// Sync Results
// =============================================================================

/**
 * Error that occurred during sync
 */
export interface SyncError {
  entityId: string;
  error: string;
  entityType?: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  chunksAdded: number;
  chunksUpdated: number;
  chunksDeleted: number;
  errors: SyncError[];
  duration: number;
}

/**
 * Create a successful sync result
 */
export function createSyncResult(
  chunksAdded: number,
  chunksUpdated: number,
  chunksDeleted: number,
  errors: SyncError[],
  duration: number
): SyncResult {
  return {
    success: errors.length === 0,
    chunksAdded,
    chunksUpdated,
    chunksDeleted,
    errors,
    duration,
  };
}

// =============================================================================
// Generic Result Type
// =============================================================================

/**
 * Generic result type for operations that can fail
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<T>(error: string): Result<T> {
  return { success: false, error };
}

// =============================================================================
// Connector Interface
// =============================================================================

/**
 * Base interface for all knowledge connectors
 */
export interface KnowledgeConnector {
  /**
   * Sync knowledge from the source
   */
  sync(userId: string, sourceId: string): Promise<SyncResult>;

  /**
   * Test the connection to the source
   */
  testConnection?(): Promise<Result<boolean>>;
}

// =============================================================================
// Source Types
// =============================================================================

/**
 * Knowledge source types with implemented connectors
 */
export type ImplementedSourceType = 'fibery' | 'notion' | 'discord';

/**
 * Knowledge source types planned for future implementation
 */
export type PlannedSourceType = 'google_docs' | 'email_history';

/**
 * Manual knowledge source types
 */
export type ManualSourceType = 'manual' | 'uploaded';

/**
 * All knowledge source types
 */
export type KnowledgeSourceType = ImplementedSourceType | PlannedSourceType | ManualSourceType;

/**
 * Type guard to check if a source type has an implemented connector
 */
export function isImplementedSource(sourceType: KnowledgeSourceType): sourceType is ImplementedSourceType {
  return sourceType === 'fibery' || sourceType === 'notion' || sourceType === 'discord';
}
