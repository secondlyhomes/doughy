/**
 * Knowledge Source Connectors
 *
 * This module exports all available connectors for importing knowledge
 * from external sources into OpenClaw's memory system.
 *
 * Supported sources:
 * - Fibery: Document databases and workspaces
 * - Notion: Pages and databases
 * - Discord: Community channels (Q&A, insights)
 *
 * @see /docs/moltbot-ecosystem-expansion.md
 */

export * from './fibery.js';
export * from './notion.js';
export * from './discord.js';

import { FiberyConnector, createFiberyConnector, FiberyConfig } from './fibery.js';
import { NotionConnector, createNotionConnector, NotionConfig } from './notion.js';
import { DiscordConnector, createDiscordConnector, DiscordConfig } from './discord.js';

// =============================================================================
// Connector Factory
// =============================================================================

export type KnowledgeSourceType = 'fibery' | 'notion' | 'discord' | 'google_docs' | 'email_history' | 'manual' | 'uploaded';

export type AnyConnector = FiberyConnector | NotionConnector | DiscordConnector;

export interface ConnectorConfig {
  sourceType: KnowledgeSourceType;
  config: Record<string, unknown>;
}

/**
 * Create a connector based on source type
 */
export function createConnector(sourceType: KnowledgeSourceType, configJson: Record<string, unknown>): AnyConnector {
  switch (sourceType) {
    case 'fibery':
      return createFiberyConnector(configJson);
    case 'notion':
      return createNotionConnector(configJson);
    case 'discord':
      return createDiscordConnector(configJson);
    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}

/**
 * Test connection for any connector type
 */
export async function testConnection(
  sourceType: KnowledgeSourceType,
  configJson: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const connector = createConnector(sourceType, configJson);

    if ('testConnection' in connector) {
      return await (connector as NotionConnector | DiscordConnector).testConnection();
    }

    // For connectors without testConnection, try a sync with no-op
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

/**
 * Sync knowledge from a source
 */
export async function syncKnowledgeSource(
  sourceType: KnowledgeSourceType,
  configJson: Record<string, unknown>,
  userId: string,
  sourceId: string
): Promise<{
  success: boolean;
  chunksAdded: number;
  chunksUpdated: number;
  chunksDeleted: number;
  errors: Array<{ entityId: string; error: string }>;
  duration: number;
}> {
  const connector = createConnector(sourceType, configJson);
  return connector.sync(userId, sourceId);
}
