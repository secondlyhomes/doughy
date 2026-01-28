/**
 * Discord Connector
 *
 * Monitors Discord community channels to extract insights, best practices,
 * and Q&A patterns for MoltBot's knowledge base.
 *
 * Features:
 * - Monitor channels for high-engagement messages
 * - Extract Q&A patterns from discussions
 * - Identify expert responses and best practices
 * - Store insights in moltbot_knowledge_chunks
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
  detectChunkType,
  getExistingChunks,
  upsertChunk,
  deleteChunk,
} from './utils.js';

// =============================================================================
// Types
// =============================================================================

export interface DiscordConfig {
  botToken: string;
  guildId: string;
  channelIds: string[];
  minReactions?: number;  // Minimum reactions to consider high-engagement
  syncDays?: number;  // How many days back to sync
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
  channel_id: string;
  timestamp: string;
  reactions?: Array<{
    emoji: { name: string; id?: string };
    count: number;
  }>;
  referenced_message?: DiscordMessage;
  thread?: {
    id: string;
    name: string;
  };
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id: string;
}

interface QAPair {
  question: string;
  answer: string;
  questionAuthor: string;
  answerAuthor: string;
  engagement: number;
  messageId: string;
  channelId: string;
  timestamp: string;
}

interface CommunityInsight {
  content: string;
  author: string;
  engagement: number;
  messageId: string;
  channelId: string;
  timestamp: string;
  context?: string;
}

// =============================================================================
// Discord API Client
// =============================================================================

class DiscordApiClient {
  private baseUrl = 'https://discord.com/api/v10';
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  /**
   * Make an authenticated request to Discord API
   */
  private async request<T>(endpoint: string): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bot ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = (errorData as Record<string, unknown>)?.message || response.statusText;
        return err(`Discord API error: ${response.status} - ${message}`);
      }

      const data = await response.json();
      return ok(data as T);
    } catch (error) {
      return err(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test connection to Discord
   */
  async testConnection(): Promise<Result<boolean>> {
    const result = await this.request<{ id: string; username: string }>('/users/@me');
    if (!result.success) {
      return err(result.error || 'Connection test failed');
    }
    return ok(true);
  }

  /**
   * Get guild information
   */
  async getGuild(guildId: string): Promise<Result<{ id: string; name: string }>> {
    return this.request(`/guilds/${encodeURIComponent(guildId)}`);
  }

  /**
   * Get channel information
   */
  async getChannel(channelId: string): Promise<Result<DiscordChannel>> {
    return this.request(`/channels/${encodeURIComponent(channelId)}`);
  }

  /**
   * Get messages from a channel
   */
  async getMessages(channelId: string, limit = 100, before?: string): Promise<Result<DiscordMessage[]>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) {
      params.set('before', before);
    }
    return this.request(`/channels/${encodeURIComponent(channelId)}/messages?${params.toString()}`);
  }

  /**
   * Get all messages from a channel within a time range
   */
  async getAllMessages(channelId: string, sinceDays: number): Promise<Result<DiscordMessage[]>> {
    const allMessages: DiscordMessage[] = [];
    const cutoffTime = Date.now() - (sinceDays * 24 * 60 * 60 * 1000);
    let before: string | undefined;
    let continueLoop = true;

    while (continueLoop) {
      const result = await this.getMessages(channelId, 100, before);
      if (!result.success) {
        return err(result.error || 'Failed to fetch messages');
      }

      const messages = result.data || [];
      if (messages.length === 0) {
        break;
      }

      for (const message of messages) {
        const messageTime = new Date(message.timestamp).getTime();
        if (messageTime < cutoffTime) {
          continueLoop = false;
          break;
        }
        allMessages.push(message);
      }

      before = messages[messages.length - 1]?.id;

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return ok(allMessages);
  }
}

// =============================================================================
// Content Extraction
// =============================================================================

/**
 * Calculate engagement score for a message
 */
function calculateEngagement(message: DiscordMessage): number {
  let score = 0;

  // Reaction count
  if (message.reactions) {
    for (const reaction of message.reactions) {
      score += reaction.count;
      // Bonus for thumbs up, heart, etc.
      if (['👍', '❤️', '🔥', '⭐', '💯'].includes(reaction.emoji.name)) {
        score += reaction.count * 0.5;
      }
    }
  }

  return Math.round(score);
}

/**
 * Check if a message looks like a question
 */
function isQuestion(content: string): boolean {
  const questionIndicators = [
    /\?$/,
    /^(how|what|when|where|why|who|which|can|could|would|should|is|are|do|does|has|have)/i,
    /anyone know/i,
    /help me/i,
    /looking for/i,
  ];

  return questionIndicators.some(pattern => pattern.test(content.trim()));
}

/**
 * Extract Q&A pairs from messages
 */
function extractQAPairs(messages: DiscordMessage[], minEngagement: number): QAPair[] {
  const pairs: QAPair[] = [];

  for (const message of messages) {
    // Skip bot messages
    if (message.author.bot) continue;

    // Check if this is a reply to a question
    if (message.referenced_message && !message.referenced_message.author.bot) {
      const question = message.referenced_message;
      const answer = message;

      if (isQuestion(question.content)) {
        const engagement = calculateEngagement(answer);

        if (engagement >= minEngagement) {
          pairs.push({
            question: question.content,
            answer: answer.content,
            questionAuthor: question.author.username,
            answerAuthor: answer.author.username,
            engagement,
            messageId: answer.id,
            channelId: answer.channel_id,
            timestamp: answer.timestamp,
          });
        }
      }
    }
  }

  // Sort by engagement
  return pairs.sort((a, b) => b.engagement - a.engagement);
}

/**
 * Extract high-engagement community insights
 */
function extractInsights(messages: DiscordMessage[], minEngagement: number): CommunityInsight[] {
  const insights: CommunityInsight[] = [];

  for (const message of messages) {
    // Skip bot messages and short messages
    if (message.author.bot || message.content.length < 100) continue;

    const engagement = calculateEngagement(message);

    if (engagement >= minEngagement) {
      insights.push({
        content: message.content,
        author: message.author.username,
        engagement,
        messageId: message.id,
        channelId: message.channel_id,
        timestamp: message.timestamp,
        context: message.referenced_message?.content,
      });
    }
  }

  // Sort by engagement
  return insights.sort((a, b) => b.engagement - a.engagement);
}

// =============================================================================
// Discord Connector Class
// =============================================================================

export class DiscordConnector implements KnowledgeConnector {
  private client: DiscordApiClient;
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    this.config = config;
    this.client = new DiscordApiClient(config.botToken);
  }

  /**
   * Test connection to Discord
   */
  async testConnection(): Promise<Result<boolean>> {
    // Test bot connection
    const botResult = await this.client.testConnection();
    if (!botResult.success) {
      return botResult;
    }

    // Test guild access
    const guildResult = await this.client.getGuild(this.config.guildId);
    if (!guildResult.success) {
      return err(`Cannot access guild: ${guildResult.error}`);
    }

    return ok(true);
  }

  /**
   * Sync content from Discord to knowledge base
   */
  async sync(userId: string, sourceId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let chunksAdded = 0;
    let chunksUpdated = 0;
    let chunksDeleted = 0;

    const minReactions = this.config.minReactions ?? 2;
    const syncDays = this.config.syncDays ?? 30;

    // Get existing chunks for this source
    const existingResult = await getExistingChunks(userId, sourceId);
    if (!existingResult.success) {
      return createSyncResult(0, 0, 0, [{
        entityId: 'sync',
        error: existingResult.error || 'Failed to fetch existing chunks',
      }], Date.now() - startTime);
    }

    const existingChunks = existingResult.data || [];
    const processedIds = new Set<string>();

    // Process each channel
    for (const channelId of this.config.channelIds) {
      // Get channel info
      const channelResult = await this.client.getChannel(channelId);
      if (!channelResult.success) {
        errors.push({
          entityId: channelId,
          error: channelResult.error || 'Failed to fetch channel',
        });
        continue;
      }

      const channel = channelResult.data;
      if (!channel) continue;

      // Get messages
      const messagesResult = await this.client.getAllMessages(channelId, syncDays);
      if (!messagesResult.success) {
        errors.push({
          entityId: channelId,
          error: messagesResult.error || 'Failed to fetch messages',
        });
        continue;
      }

      const messages = messagesResult.data || [];

      // Extract Q&A pairs
      const qaPairs = extractQAPairs(messages, minReactions);
      for (const qa of qaPairs) {
        const externalId = `qa-${qa.messageId}`;
        processedIds.add(externalId);

        const content = `Q: ${qa.question}\n\nA: ${qa.answer}`;
        const chunk: KnowledgeChunk = {
          sourceId,
          userId,
          chunkType: 'faq',
          title: `Q&A from #${channel.name}`,
          content,
          metadata: {
            questionAuthor: qa.questionAuthor,
            answerAuthor: qa.answerAuthor,
            engagement: qa.engagement,
            channelId: qa.channelId,
            channelName: channel.name,
            messageId: qa.messageId,
            timestamp: qa.timestamp,
            externalUrl: `https://discord.com/channels/${this.config.guildId}/${qa.channelId}/${qa.messageId}`,
          },
          externalId,
          tokenCount: estimateTokens(content),
          contentHash: hashContent(content),
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
            entityId: externalId,
            error: result.error || 'Failed to upsert Q&A chunk',
          });
        }
      }

      // Extract community insights
      const insights = extractInsights(messages, minReactions * 2);
      for (const insight of insights) {
        const externalId = `insight-${insight.messageId}`;
        processedIds.add(externalId);

        let content = insight.content;
        if (insight.context) {
          content = `Context: ${insight.context}\n\nInsight: ${content}`;
        }

        const chunk: KnowledgeChunk = {
          sourceId,
          userId,
          chunkType: 'community_insight',
          title: `Insight from #${channel.name}`,
          content,
          metadata: {
            author: insight.author,
            engagement: insight.engagement,
            channelId: insight.channelId,
            channelName: channel.name,
            messageId: insight.messageId,
            timestamp: insight.timestamp,
            externalUrl: `https://discord.com/channels/${this.config.guildId}/${insight.channelId}/${insight.messageId}`,
          },
          externalId,
          tokenCount: estimateTokens(content),
          contentHash: hashContent(content),
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
            entityId: externalId,
            error: result.error || 'Failed to upsert insight chunk',
          });
        }
      }
    }

    // Delete chunks that no longer exist
    for (const chunk of existingChunks) {
      if (!processedIds.has(chunk.externalId) && chunk.id) {
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
   * Monitor a channel for new high-engagement content
   * Call this periodically to keep knowledge base updated
   */
  async monitorChannel(
    channelId: string,
    userId: string,
    sourceId: string,
    sinceDays = 1
  ): Promise<Result<{ added: number; updated: number }>> {
    const minReactions = this.config.minReactions ?? 2;

    // Get existing chunks
    const existingResult = await getExistingChunks(userId, sourceId);
    if (!existingResult.success) {
      return err(existingResult.error || 'Failed to fetch existing chunks');
    }

    const existingChunks = existingResult.data || [];

    // Get recent messages
    const messagesResult = await this.client.getAllMessages(channelId, sinceDays);
    if (!messagesResult.success) {
      return err(messagesResult.error || 'Failed to fetch messages');
    }

    const messages = messagesResult.data || [];
    let added = 0;
    let updated = 0;

    // Get channel info
    const channelResult = await this.client.getChannel(channelId);
    const channelName = channelResult.success ? channelResult.data?.name : 'unknown';

    // Process Q&A pairs
    const qaPairs = extractQAPairs(messages, minReactions);
    for (const qa of qaPairs) {
      const externalId = `qa-${qa.messageId}`;
      const content = `Q: ${qa.question}\n\nA: ${qa.answer}`;

      const chunk: KnowledgeChunk = {
        sourceId,
        userId,
        chunkType: 'faq',
        title: `Q&A from #${channelName}`,
        content,
        metadata: {
          questionAuthor: qa.questionAuthor,
          answerAuthor: qa.answerAuthor,
          engagement: qa.engagement,
          channelId: qa.channelId,
          channelName,
          messageId: qa.messageId,
          timestamp: qa.timestamp,
          externalUrl: `https://discord.com/channels/${this.config.guildId}/${qa.channelId}/${qa.messageId}`,
        },
        externalId,
        tokenCount: estimateTokens(content),
        contentHash: hashContent(content),
      };

      const result = await upsertChunk(chunk, existingChunks);
      if (result.success && result.data) {
        if (result.data.isNew) {
          added++;
        } else {
          updated++;
        }
      }
    }

    return ok({ added, updated });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Discord connector from stored configuration
 */
export function createDiscordConnector(configJson: Record<string, unknown>): DiscordConnector {
  const discordConfig: DiscordConfig = {
    botToken: configJson.bot_token as string,
    guildId: configJson.guild_id as string,
    channelIds: configJson.channel_ids as string[] || [],
    minReactions: configJson.min_reactions as number | undefined,
    syncDays: configJson.sync_days as number | undefined,
  };

  if (!discordConfig.botToken || !discordConfig.guildId) {
    throw new Error('Invalid Discord configuration: missing bot_token or guild_id');
  }

  return new DiscordConnector(discordConfig);
}
