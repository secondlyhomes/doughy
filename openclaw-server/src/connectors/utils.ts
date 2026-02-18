/**
 * Shared Utilities for Knowledge Connectors
 *
 * Common functions used across Fibery, Notion, and Discord connectors
 * for content processing, chunk management, and database operations.
 */

import { config } from '../config.js';
import {
  ChunkType,
  KnowledgeChunk,
  PersistedKnowledgeChunk,
  Result,
  ok,
  err,
} from '../types/knowledge.js';

// =============================================================================
// Content Processing
// =============================================================================

/**
 * Generate a simple hash for content comparison
 * Uses a basic string hash for efficiency
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Estimate token count for a piece of content
 * Rough estimate: ~4 characters per token
 */
export function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Chunk long content into smaller pieces for storage
 */
export function chunkContent(
  content: string,
  maxTokens: number = 1000,
  overlap: number = 100
): string[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  if (content.length <= maxChars) {
    return [content];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    let end = start + maxChars;

    // Try to break at a sentence boundary
    if (end < content.length) {
      const lastPeriod = content.lastIndexOf('.', end);
      const lastNewline = content.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > start + maxChars / 2) {
        end = breakPoint + 1;
      }
    }

    chunks.push(content.slice(start, end).trim());
    start = end - overlapChars;
  }

  return chunks;
}

/**
 * Detect the type of content chunk based on content analysis
 */
export function detectChunkType(
  content: string,
  title?: string,
  sourceHints?: {
    isFromFAQ?: boolean;
    isFromSOP?: boolean;
    isFromPolicy?: boolean;
    isFromDiscussion?: boolean;
  }
): ChunkType {
  const lowerContent = content.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Use source hints if available
  if (sourceHints?.isFromFAQ) return 'faq';
  if (sourceHints?.isFromSOP) return 'sop';
  if (sourceHints?.isFromPolicy) return 'policy';
  if (sourceHints?.isFromDiscussion) return 'community_insight';

  // Check for FAQ patterns
  if (
    lowerTitle.includes('faq') ||
    lowerContent.includes('frequently asked') ||
    /^(q:|question:|a:|answer:)/m.test(lowerContent)
  ) {
    return 'faq';
  }

  // Check for SOP patterns
  if (
    lowerTitle.includes('sop') ||
    lowerTitle.includes('procedure') ||
    lowerTitle.includes('process') ||
    /step \d+|1\.|first,|then,/i.test(lowerContent)
  ) {
    return 'sop';
  }

  // Check for policy patterns
  if (
    lowerTitle.includes('policy') ||
    lowerTitle.includes('rule') ||
    lowerContent.includes('must not') ||
    lowerContent.includes('is required')
  ) {
    return 'policy';
  }

  // Check for email template patterns
  if (
    lowerTitle.includes('template') ||
    lowerTitle.includes('email') ||
    lowerContent.includes('dear [') ||
    lowerContent.includes('hi [')
  ) {
    return 'email_template';
  }

  // Check for property rule patterns
  if (
    lowerTitle.includes('house rule') ||
    lowerTitle.includes('property rule') ||
    lowerContent.includes('check-in') ||
    lowerContent.includes('checkout')
  ) {
    return 'property_rule';
  }

  // Default to training material
  return 'training_material';
}

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Get existing chunks for a user and source
 * Returns Result type to distinguish between "no chunks" and "query failed"
 */
export async function getExistingChunks(
  userId: string,
  sourceId: string
): Promise<Result<PersistedKnowledgeChunk[]>> {
  try {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/openclaw_knowledge_chunks?user_id=eq.${encodeURIComponent(userId)}&source_id=eq.${encodeURIComponent(sourceId)}&select=id,external_id,content_hash`,
      {
        headers: {
          'Authorization': `Bearer ${config.supabaseServiceKey}`,
          'apikey': config.supabaseServiceKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return err(`Failed to fetch existing chunks: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return ok(data as PersistedKnowledgeChunk[]);
  } catch (error) {
    return err(`Network error fetching chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upsert a knowledge chunk to the database
 * Returns Result type to indicate success/failure
 */
export async function upsertChunk(
  chunk: KnowledgeChunk,
  existingChunks: PersistedKnowledgeChunk[]
): Promise<Result<{ id: string; isNew: boolean }>> {
  try {
    const existing = existingChunks.find(c => c.externalId === chunk.externalId);
    const isNew = !existing;

    // Check if content actually changed
    if (existing && existing.contentHash === chunk.contentHash) {
      return ok({ id: existing.id, isNew: false });
    }

    const method = isNew ? 'POST' : 'PATCH';
    const url = isNew
      ? `${config.supabaseUrl}/rest/v1/openclaw_knowledge_chunks`
      : `${config.supabaseUrl}/rest/v1/openclaw_knowledge_chunks?id=eq.${encodeURIComponent(existing!.id)}`;

    const body = {
      user_id: chunk.userId,
      source_id: chunk.sourceId,
      chunk_type: chunk.chunkType,
      title: chunk.title,
      content: chunk.content,
      external_id: chunk.externalId,
      content_hash: chunk.contentHash,
      metadata: chunk.metadata,
      token_count: chunk.tokenCount || estimateTokens(chunk.content),
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseServiceKey}`,
        'apikey': config.supabaseServiceKey,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(isNew ? body : { ...body, updated_at: new Date().toISOString() }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return err(`Failed to ${isNew ? 'create' : 'update'} chunk: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const returnedId = Array.isArray(result) ? result[0]?.id : result?.id;

    if (!returnedId) {
      return err('Chunk upsert succeeded but no ID returned');
    }

    return ok({ id: returnedId, isNew });
  } catch (error) {
    return err(`Network error upserting chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a knowledge chunk from the database
 * Returns Result type to indicate success/failure
 */
export async function deleteChunk(chunkId: string): Promise<Result<void>> {
  try {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/openclaw_knowledge_chunks?id=eq.${encodeURIComponent(chunkId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.supabaseServiceKey}`,
          'apikey': config.supabaseServiceKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return err(`Failed to delete chunk ${chunkId}: ${response.status} - ${errorText}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(`Network error deleting chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple chunks that are no longer in the source
 */
export async function deleteOrphanedChunks(
  existingChunks: PersistedKnowledgeChunk[],
  currentExternalIds: Set<string>
): Promise<{ deleted: number; errors: Array<{ id: string; error: string }> }> {
  const orphaned = existingChunks.filter(c => !currentExternalIds.has(c.externalId));
  let deleted = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const chunk of orphaned) {
    const result = await deleteChunk(chunk.id);
    if (result.success) {
      deleted++;
    } else {
      errors.push({ id: chunk.id, error: result.error || 'Unknown error' });
    }
  }

  return { deleted, errors };
}
