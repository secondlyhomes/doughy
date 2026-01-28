/**
 * Fibery Connector
 *
 * Integrates with Fibery workspaces to import property rules, SOPs,
 * response templates, and other knowledge into MoltBot's memory system.
 *
 * Features:
 * - Fetch documents from Fibery databases
 * - Extract structured content (property rules, templates)
 * - Chunk content for retrieval
 * - Generate embeddings for semantic search (optional)
 * - Store in moltbot_knowledge_chunks
 *
 * @see /docs/moltbot-ecosystem-expansion.md for knowledge integration
 */

import { config } from '../config.js';
import {
  ChunkType,
  KnowledgeChunk,
  PersistedKnowledgeChunk,
  SyncResult,
  SyncError,
  Result,
  KnowledgeConnector,
  createSyncResult,
  ok,
  err,
} from '../types/knowledge.js';
import {
  hashContent,
  estimateTokens,
  chunkContent,
  detectChunkType,
  getExistingChunks,
  upsertChunk,
  deleteChunk,
} from './utils.js';

// =============================================================================
// Types
// =============================================================================

export interface FiberyConfig {
  workspaceId: string;
  apiKey: string;
  databaseIds: string[];
  fieldMappings?: FieldMapping[];
}

export interface FieldMapping {
  fiberyField: string;
  chunkType: ChunkType;
  metadataField?: string;
}

export interface FiberyEntity {
  id: string;
  name?: string;
  'fibery/id': string;
  'fibery/public-id'?: string;
  [key: string]: unknown;
}

interface FiberyCommand {
  command: string;
  args: Record<string, unknown>;
}

interface FiberyResponse {
  success: boolean;
  result?: unknown[];
  error?: string;
}

interface FiberyDocNode {
  text?: string;
  content?: FiberyDocNode[];
}

// =============================================================================
// Fibery API Client
// =============================================================================

class FiberyApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(workspaceId: string, apiKey: string) {
    this.baseUrl = `https://${encodeURIComponent(workspaceId)}.fibery.io/api`;
    this.apiKey = apiKey;
  }

  /**
   * Execute a Fibery query
   */
  async query(commands: FiberyCommand[]): Promise<Result<FiberyResponse[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiKey}`,
        },
        body: JSON.stringify(commands),
      });

      if (!response.ok) {
        return err(`Fibery API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return ok(data);
    } catch (error) {
      return err(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<Result<boolean>> {
    const command: FiberyCommand = {
      command: 'fibery.schema/query',
      args: {},
    };

    const result = await this.query([command]);
    if (!result.success) {
      return err(result.error || 'Connection test failed');
    }

    return ok(true);
  }

  /**
   * Get all entities from a database
   */
  async getEntities(databaseName: string, fields: string[], limit = 100): Promise<Result<FiberyEntity[]>> {
    const command: FiberyCommand = {
      command: 'fibery.entity/query',
      args: {
        query: {
          'q/from': databaseName,
          'q/select': fields.reduce((acc, field) => {
            acc[field] = field;
            return acc;
          }, {} as Record<string, string>),
          'q/limit': limit,
        },
      },
    };

    const result = await this.query([command]);
    if (!result.success) {
      return err(result.error || 'Failed to fetch entities');
    }

    const data = result.data;
    if (!data || !data[0]) {
      return ok([]);
    }

    return ok((data[0].result || []) as FiberyEntity[]);
  }

  /**
   * Get rich text content for an entity
   */
  async getRichTextContent(entityType: string, entityId: string, fieldName: string): Promise<Result<string>> {
    const command: FiberyCommand = {
      command: 'fibery.entity/query',
      args: {
        query: {
          'q/from': entityType,
          'q/select': {
            [fieldName]: {
              'q/select': ['Collaboration~Documents/secret'],
            },
          },
          'q/where': ['=', ['fibery/id'], `$id`],
          'q/limit': 1,
        },
        params: {
          '$id': entityId,
        },
      },
    };

    const result = await this.query([command]);
    if (!result.success) {
      return err(result.error || 'Failed to fetch rich text');
    }

    const data = result.data;
    const entity = data?.[0]?.result?.[0] as Record<string, Record<string, string>> | undefined;
    const secret = entity?.[fieldName]?.['Collaboration~Documents/secret'];

    if (!secret) {
      return ok(''); // No content, not an error
    }

    // Fetch the document content
    try {
      const docResponse = await fetch(`${this.baseUrl}/documents/${encodeURIComponent(secret)}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
        },
      });

      if (!docResponse.ok) {
        return err(`Failed to fetch document: ${docResponse.status}`);
      }

      const doc = await docResponse.json();
      return ok(this.extractTextFromDocument(doc));
    } catch (error) {
      return err(`Network error fetching document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract plain text from Fibery document format
   */
  private extractTextFromDocument(doc: { content?: FiberyDocNode[] }): string {
    if (!doc?.content) return '';

    const extractText = (node: FiberyDocNode): string => {
      if (node.text) return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('\n');
      }
      return '';
    };

    return doc.content.map(extractText).join('\n').trim();
  }
}

// =============================================================================
// Fibery Connector Class
// =============================================================================

export class FiberyConnector implements KnowledgeConnector {
  private client: FiberyApiClient;
  private config: FiberyConfig;

  constructor(config: FiberyConfig) {
    this.config = config;
    this.client = new FiberyApiClient(config.workspaceId, config.apiKey);
  }

  /**
   * Test connection to Fibery
   */
  async testConnection(): Promise<Result<boolean>> {
    return this.client.testConnection();
  }

  /**
   * Sync content from Fibery to knowledge base
   */
  async sync(userId: string, sourceId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let chunksAdded = 0;
    let chunksUpdated = 0;
    let chunksDeleted = 0;

    // Get existing chunks for this source
    const existingResult = await getExistingChunks(userId, sourceId);
    if (!existingResult.success) {
      return createSyncResult(0, 0, 0, [{
        entityId: 'sync',
        error: existingResult.error || 'Failed to fetch existing chunks',
      }], Date.now() - startTime);
    }

    const existingChunks = existingResult.data || [];
    const existingByExternalId = new Map(existingChunks.map(c => [c.externalId, c]));
    const processedIds = new Set<string>();

    // Process each database
    for (const databaseId of this.config.databaseIds) {
      const entitiesResult = await this.client.getEntities(databaseId, [
        'fibery/id',
        'fibery/public-id',
        'Name',
        'Description',
      ]);

      if (!entitiesResult.success) {
        errors.push({
          entityId: databaseId,
          error: entitiesResult.error || 'Failed to fetch entities',
        });
        continue;
      }

      const entities = entitiesResult.data || [];

      for (const entity of entities) {
        const externalId = entity['fibery/id'] as string;
        processedIds.add(externalId);

        // Get rich text content if available
        let content = '';
        if (entity.Description) {
          const contentResult = await this.client.getRichTextContent(
            databaseId,
            externalId,
            'Description'
          );

          if (contentResult.success) {
            content = contentResult.data || '';
          } else {
            errors.push({
              entityId: externalId,
              error: contentResult.error || 'Failed to fetch content',
            });
          }
        }

        if (!content && entity.Name) {
          content = entity.Name as string;
        }

        if (!content) continue;

        const title = (entity.Name as string) || undefined;
        const contentHashValue = hashContent(content);

        // Check if content has changed
        const existing = existingByExternalId.get(externalId);
        if (existing && existing.contentHash === contentHashValue) {
          continue; // No changes
        }

        // Chunk the content if needed
        const chunks = chunkContent(content);

        for (let i = 0; i < chunks.length; i++) {
          const chunkContentText = chunks[i];
          const chunkId = chunks.length > 1 ? `${externalId}-${i}` : externalId;

          const chunk: KnowledgeChunk = {
            sourceId,
            userId,
            chunkType: detectChunkType(chunkContentText, title),
            title: chunks.length > 1 ? `${title} (Part ${i + 1})` : title,
            content: chunkContentText,
            metadata: {
              fiberyDatabaseId: databaseId,
              fiberyPublicId: entity['fibery/public-id'],
              partIndex: chunks.length > 1 ? i : undefined,
              totalParts: chunks.length > 1 ? chunks.length : undefined,
              externalUrl: `https://${this.config.workspaceId}.fibery.io/${entity['fibery/public-id']}`,
            },
            externalId: chunkId,
            tokenCount: estimateTokens(chunkContentText),
            contentHash: hashContent(chunkContentText),
          };

          const result = await upsertChunk(chunk, existingChunks);
          if (result.success && result.data) {
            if (result.data.isNew) {
              chunksAdded++;
            } else {
              chunksUpdated++;
            }
          } else {
            errors.push({
              entityId: chunkId,
              error: result.error || 'Failed to upsert chunk',
            });
          }
        }
      }
    }

    // Delete chunks that no longer exist in Fibery
    for (const [externalId, chunk] of existingByExternalId) {
      // Check if this is a base ID (not a part)
      const baseId = externalId.split('-')[0];
      if (!processedIds.has(baseId) && chunk.id) {
        const deleteResult = await deleteChunk(chunk.id);
        if (deleteResult.success) {
          chunksDeleted++;
        } else {
          errors.push({
            entityId: chunk.id,
            error: deleteResult.error || 'Failed to delete chunk',
          });
        }
      }
    }

    return createSyncResult(chunksAdded, chunksUpdated, chunksDeleted, errors, Date.now() - startTime);
  }

  /**
   * Search knowledge chunks
   */
  async search(userId: string, query: string, limit = 5): Promise<Result<KnowledgeChunk[]>> {
    try {
      const response = await fetch(
        `${config.supabaseUrl}/rest/v1/rpc/search_knowledge_keyword`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.supabaseServiceKey}`,
            'apikey': config.supabaseServiceKey,
          },
          body: JSON.stringify({
            p_user_id: userId,
            p_query: query,
            p_chunk_types: null,
            p_limit: limit,
          }),
        }
      );

      if (!response.ok) {
        return err(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      return ok(data);
    } catch (error) {
      return err(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Fibery connector from stored configuration
 */
export function createFiberyConnector(configJson: Record<string, unknown>): FiberyConnector {
  const fiberyConfig: FiberyConfig = {
    workspaceId: configJson.workspace_id as string,
    apiKey: configJson.api_key as string,
    databaseIds: configJson.database_ids as string[] || [],
    fieldMappings: configJson.field_mappings as FieldMapping[] | undefined,
  };

  if (!fiberyConfig.workspaceId || !fiberyConfig.apiKey) {
    throw new Error('Invalid Fibery configuration: missing workspace_id or api_key');
  }

  return new FiberyConnector(fiberyConfig);
}
