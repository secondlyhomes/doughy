/**
 * Notion Connector
 *
 * Integrates with Notion workspaces to import property rules, SOPs,
 * response templates, and other knowledge into MoltBot's memory system.
 *
 * Features:
 * - Fetch pages and databases from Notion
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

export interface NotionConfig {
  integrationToken: string;
  workspaceId?: string;
  databaseIds: string[];
  pageIds?: string[];
  fieldMappings?: NotionFieldMapping[];
}

export interface NotionFieldMapping {
  notionProperty: string;
  chunkType: ChunkType;
  metadataField?: string;
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  parent: { type: string; database_id?: string; page_id?: string };
  properties: Record<string, NotionProperty>;
  url: string;
}

export interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  rich_text?: Array<{ plain_text: string }>;
  select?: { name: string };
  multi_select?: Array<{ name: string }>;
  number?: number;
  checkbox?: boolean;
  url?: string;
  email?: string;
  phone_number?: string;
  date?: { start: string; end?: string };
  [key: string]: unknown;
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

// =============================================================================
// Notion API Client
// =============================================================================

class NotionApiClient {
  private baseUrl = 'https://api.notion.com/v1';
  private integrationToken: string;
  private apiVersion = '2022-06-28';

  constructor(integrationToken: string) {
    this.integrationToken = integrationToken;
  }

  /**
   * Make an authenticated request to Notion API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: Record<string, unknown>
  ): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.integrationToken}`,
          'Notion-Version': this.apiVersion,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = (errorData as Record<string, unknown>)?.message || response.statusText;
        return err(`Notion API error: ${response.status} - ${message}`);
      }

      const data = await response.json();
      return ok(data as T);
    } catch (error) {
      return err(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to Notion
   */
  async testConnection(): Promise<Result<boolean>> {
    const result = await this.request<{ bot: { workspace_name: string } }>('/users/me');
    if (!result.success) {
      return err(result.error || 'Connection test failed');
    }
    return ok(true);
  }

  /**
   * Query a Notion database
   */
  async queryDatabase(databaseId: string, startCursor?: string): Promise<Result<{
    results: NotionPage[];
    next_cursor: string | null;
    has_more: boolean;
  }>> {
    return this.request(`/databases/${encodeURIComponent(databaseId)}/query`, 'POST', {
      start_cursor: startCursor,
      page_size: 100,
    });
  }

  /**
   * Get a Notion page
   */
  async getPage(pageId: string): Promise<Result<NotionPage>> {
    return this.request(`/pages/${encodeURIComponent(pageId)}`);
  }

  /**
   * Get blocks for a page
   */
  async getBlocks(pageId: string, startCursor?: string): Promise<Result<{
    results: NotionBlock[];
    next_cursor: string | null;
    has_more: boolean;
  }>> {
    const params = startCursor ? `?start_cursor=${encodeURIComponent(startCursor)}` : '';
    return this.request(`/blocks/${encodeURIComponent(pageId)}/children${params}`);
  }

  /**
   * Get all blocks for a page (handling pagination)
   */
  async getAllBlocks(pageId: string): Promise<Result<NotionBlock[]>> {
    const allBlocks: NotionBlock[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getBlocks(pageId, cursor);
      if (!result.success) {
        return err(result.error || 'Failed to fetch blocks');
      }

      allBlocks.push(...(result.data?.results || []));
      cursor = result.data?.next_cursor || undefined;
      hasMore = result.data?.has_more || false;
    }

    return ok(allBlocks);
  }
}

// =============================================================================
// Content Extraction
// =============================================================================

/**
 * Extract title from Notion page properties
 */
function extractTitle(properties: Record<string, NotionProperty>): string | undefined {
  for (const prop of Object.values(properties)) {
    if (prop.type === 'title' && prop.title) {
      return prop.title.map(t => t.plain_text).join('');
    }
  }
  return undefined;
}

/**
 * Extract text content from Notion blocks
 */
function extractBlockContent(blocks: NotionBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    const blockType = block.type;
    const blockData = block[blockType] as Record<string, unknown> | undefined;

    if (!blockData) continue;

    // Handle different block types
    switch (blockType) {
      case 'paragraph':
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
      case 'bulleted_list_item':
      case 'numbered_list_item':
      case 'quote':
      case 'callout':
        const richText = blockData.rich_text as Array<{ plain_text: string }> | undefined;
        if (richText) {
          const text = richText.map(t => t.plain_text).join('');
          if (text) {
            if (blockType.startsWith('heading_')) {
              parts.push(`\n## ${text}\n`);
            } else if (blockType === 'bulleted_list_item' || blockType === 'numbered_list_item') {
              parts.push(`- ${text}`);
            } else if (blockType === 'quote') {
              parts.push(`> ${text}`);
            } else {
              parts.push(text);
            }
          }
        }
        break;

      case 'code':
        const code = blockData.rich_text as Array<{ plain_text: string }> | undefined;
        const language = blockData.language as string | undefined;
        if (code) {
          const codeText = code.map(t => t.plain_text).join('');
          parts.push(`\n\`\`\`${language || ''}\n${codeText}\n\`\`\`\n`);
        }
        break;

      case 'divider':
        parts.push('\n---\n');
        break;

      case 'toggle':
        const toggleText = blockData.rich_text as Array<{ plain_text: string }> | undefined;
        if (toggleText) {
          parts.push(toggleText.map(t => t.plain_text).join(''));
        }
        break;
    }
  }

  return parts.join('\n').trim();
}

/**
 * Extract property values as metadata
 */
function extractPropertyMetadata(properties: Record<string, NotionProperty>): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === 'title') continue; // Skip title, handled separately

    switch (prop.type) {
      case 'rich_text':
        if (prop.rich_text) {
          metadata[key] = prop.rich_text.map(t => t.plain_text).join('');
        }
        break;
      case 'select':
        if (prop.select) {
          metadata[key] = prop.select.name;
        }
        break;
      case 'multi_select':
        if (prop.multi_select) {
          metadata[key] = prop.multi_select.map(s => s.name);
        }
        break;
      case 'number':
        if (prop.number !== undefined) {
          metadata[key] = prop.number;
        }
        break;
      case 'checkbox':
        metadata[key] = prop.checkbox;
        break;
      case 'url':
        if (prop.url) {
          metadata[key] = prop.url;
        }
        break;
      case 'date':
        if (prop.date) {
          metadata[key] = prop.date;
        }
        break;
    }
  }

  return metadata;
}

// =============================================================================
// Notion Connector Class
// =============================================================================

export class NotionConnector implements KnowledgeConnector {
  private client: NotionApiClient;
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.config = config;
    this.client = new NotionApiClient(config.integrationToken);
  }

  /**
   * Test connection to Notion
   */
  async testConnection(): Promise<Result<boolean>> {
    return this.client.testConnection();
  }

  /**
   * Sync content from Notion to knowledge base
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

    // Process databases
    for (const databaseId of this.config.databaseIds) {
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const queryResult = await this.client.queryDatabase(databaseId, cursor);

        if (!queryResult.success) {
          errors.push({
            entityId: databaseId,
            error: queryResult.error || 'Failed to query database',
          });
          break;
        }

        const pages = queryResult.data?.results || [];
        cursor = queryResult.data?.next_cursor || undefined;
        hasMore = queryResult.data?.has_more || false;

        for (const page of pages) {
          const pageResult = await this.processPage(page, userId, sourceId, existingChunks, databaseId);
          processedIds.add(page.id);

          if (pageResult.success && pageResult.data) {
            chunksAdded += pageResult.data.added;
            chunksUpdated += pageResult.data.updated;
          } else if (!pageResult.success) {
            errors.push({
              entityId: page.id,
              error: pageResult.error || 'Failed to process page',
            });
          }
        }
      }
    }

    // Process individual pages
    for (const pageId of this.config.pageIds || []) {
      const pageResult = await this.client.getPage(pageId);

      if (!pageResult.success) {
        errors.push({
          entityId: pageId,
          error: pageResult.error || 'Failed to fetch page',
        });
        continue;
      }

      const page = pageResult.data;
      if (page) {
        const result = await this.processPage(page, userId, sourceId, existingChunks);
        processedIds.add(pageId);

        if (result.success && result.data) {
          chunksAdded += result.data.added;
          chunksUpdated += result.data.updated;
        } else if (!result.success) {
          errors.push({
            entityId: pageId,
            error: result.error || 'Failed to process page',
          });
        }
      }
    }

    // Delete chunks that no longer exist
    for (const [externalId, chunk] of existingByExternalId) {
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
   * Process a single Notion page
   */
  private async processPage(
    page: NotionPage,
    userId: string,
    sourceId: string,
    existingChunks: PersistedKnowledgeChunk[],
    databaseId?: string
  ): Promise<Result<{ added: number; updated: number }>> {
    let added = 0;
    let updated = 0;

    // Get page content
    const blocksResult = await this.client.getAllBlocks(page.id);
    if (!blocksResult.success) {
      return err(blocksResult.error || 'Failed to fetch page blocks');
    }

    const blocks = blocksResult.data || [];
    const content = extractBlockContent(blocks);

    if (!content) {
      return ok({ added: 0, updated: 0 });
    }

    const title = extractTitle(page.properties);
    const contentHashValue = hashContent(content);

    // Check if content has changed
    const existing = existingChunks.find(c => c.externalId === page.id);
    if (existing && existing.contentHash === contentHashValue) {
      return ok({ added: 0, updated: 0 });
    }

    // Chunk the content if needed
    const chunks = chunkContent(content);
    const propertyMetadata = extractPropertyMetadata(page.properties);

    for (let i = 0; i < chunks.length; i++) {
      const chunkContentText = chunks[i];
      const chunkId = chunks.length > 1 ? `${page.id}-${i}` : page.id;

      const chunk: KnowledgeChunk = {
        sourceId,
        userId,
        chunkType: detectChunkType(chunkContentText, title),
        title: chunks.length > 1 ? `${title} (Part ${i + 1})` : title,
        content: chunkContentText,
        metadata: {
          ...propertyMetadata,
          notionPageId: page.id,
          notionDatabaseId: databaseId,
          externalUrl: page.url,
          lastEditedTime: page.last_edited_time,
          partIndex: chunks.length > 1 ? i : undefined,
          totalParts: chunks.length > 1 ? chunks.length : undefined,
        },
        externalId: chunkId,
        tokenCount: estimateTokens(chunkContentText),
        contentHash: hashContent(chunkContentText),
      };

      const result = await upsertChunk(chunk, existingChunks);
      if (result.success && result.data) {
        if (result.data.isNew) {
          added++;
        } else {
          updated++;
        }
      } else {
        return err(result.error || 'Failed to upsert chunk');
      }
    }

    return ok({ added, updated });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Notion connector from stored configuration
 */
export function createNotionConnector(configJson: Record<string, unknown>): NotionConnector {
  const notionConfig: NotionConfig = {
    integrationToken: configJson.integration_token as string,
    workspaceId: configJson.workspace_id as string | undefined,
    databaseIds: configJson.database_ids as string[] || [],
    pageIds: configJson.page_ids as string[] | undefined,
    fieldMappings: configJson.field_mappings as NotionFieldMapping[] | undefined,
  };

  if (!notionConfig.integrationToken) {
    throw new Error('Invalid Notion configuration: missing integration_token');
  }

  return new NotionConnector(notionConfig);
}
