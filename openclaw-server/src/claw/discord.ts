// The Claw — Discord Bot Integration
// Connects Discord to the same handleClawMessage() controller
// Rich embeds for briefings, buttons for approvals

import { config } from '../config.js';
import { handleClawMessage } from './controller.js';
import { clawQuery, clawUpdate } from './db.js';
import { registerDiscordSender } from './broadcast.js';
import { callEdgeFunction } from './edge.js';

// Discord.js types — dynamic import to avoid crash if not installed
let Client: any;
let GatewayIntentBits: any;
let EmbedBuilder: any;
let ActionRowBuilder: any;
let ButtonBuilder: any;
let ButtonStyle: any;

let discordClient: any = null;
let isReady = false;

// Map Discord user IDs → Supabase user IDs
// Loaded from claw.channel_preferences where channel = 'discord'
const discordUserMap = new Map<string, string>();

/**
 * Initialize the Discord bot
 */
export async function initDiscordBot(): Promise<void> {
  const token = config.discordBotToken;
  if (!token) {
    console.log('[Discord] No DISCORD_BOT_TOKEN configured, skipping Discord bot');
    return;
  }

  try {
    const discord = await import('discord.js');
    Client = discord.Client;
    GatewayIntentBits = discord.GatewayIntentBits;
    EmbedBuilder = discord.EmbedBuilder;
    ActionRowBuilder = discord.ActionRowBuilder;
    ButtonBuilder = discord.ButtonBuilder;
    ButtonStyle = discord.ButtonStyle;
  } catch {
    console.log('[Discord] discord.js not installed. Run: npm install discord.js');
    return;
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  discordClient.once('ready', () => {
    isReady = true;
    console.log(`[Discord] Bot logged in as ${discordClient.user?.tag}`);

    // Register the Discord sender for the broadcast system
    registerDiscordSender(sendDiscordMessage);
  });

  discordClient.on('messageCreate', handleDiscordMessage);
  discordClient.on('interactionCreate', handleDiscordInteraction);

  try {
    await discordClient.login(token);
    console.log('[Discord] Bot connecting...');
  } catch (error) {
    console.error('[Discord] Login failed:', error);
  }
}

/**
 * Handle incoming Discord messages
 */
async function handleDiscordMessage(msg: any): Promise<void> {
  // Ignore bot messages
  if (msg.author.bot) return;

  // Only respond in designated channel or DMs
  const designatedChannel = config.discordChannelId;
  if (designatedChannel && msg.channel.id !== designatedChannel && !msg.channel.isDMBased?.()) {
    return;
  }

  const discordUserId = msg.author.id;

  // Look up Supabase user ID from channel preferences
  let userId = discordUserMap.get(discordUserId);
  if (!userId) {
    userId = await resolveDiscordUser(discordUserId) || undefined;
    if (!userId) {
      console.log(`[Discord] Unknown Discord user: ${msg.author.tag} (${discordUserId})`);
      await msg.reply('I don\'t recognize your account. Please link your Discord in the Doughy app settings first.');
      return;
    }
  }

  const userMessage = msg.content.trim();
  if (!userMessage) return;

  // Show typing indicator
  await msg.channel.sendTyping();

  try {
    const response = await handleClawMessage(userId, userMessage, 'discord' as any);

    // Check if the response looks like a briefing (has bullet points or stats)
    if (isBriefingResponse(response.message)) {
      await sendBriefingEmbed(msg.channel, response.message);
    } else if (response.approvals_created && response.approvals_created > 0) {
      await sendApprovalsEmbed(msg.channel, userId, response);
    } else {
      await msg.reply(response.message);
    }
  } catch (error) {
    console.error('[Discord] Message handling failed:', error);
    await msg.reply('Sorry, something went wrong. Try again in a moment.');
  }
}

/**
 * Handle Discord button interactions (approve/reject)
 */
async function handleDiscordInteraction(interaction: any): Promise<void> {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // Parse button actions: approve_<id>, reject_<id>, approve_all_<taskId>
  if (customId.startsWith('approve_all_')) {
    const taskId = customId.replace('approve_all_', '');
    await handleBatchApprove(interaction, taskId);
  } else if (customId.startsWith('approve_')) {
    const approvalId = customId.replace('approve_', '');
    await handleSingleApproval(interaction, approvalId, 'approve');
  } else if (customId.startsWith('reject_')) {
    const approvalId = customId.replace('reject_', '');
    await handleSingleApproval(interaction, approvalId, 'reject');
  } else if (customId.startsWith('skip_all_')) {
    await interaction.reply({ content: 'Skipped all drafts.', ephemeral: true });
  }
}

/**
 * Handle single approval via Discord button
 */
async function handleSingleApproval(interaction: any, approvalId: string, action: 'approve' | 'reject'): Promise<void> {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(approvalId)) {
    await interaction.reply({ content: 'Invalid approval ID.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch the approval first to verify it exists and is still pending
    const approvals = await clawQuery<{
      user_id: string;
      status: string;
      action_type: string;
      draft_content: string;
      recipient_phone: string | null;
    }>('approvals', `id=eq.${approvalId}&status=eq.pending&limit=1`);

    if (approvals.length === 0) {
      await interaction.editReply('Approval not found or already decided.');
      return;
    }

    const approval = approvals[0];
    const now = new Date().toISOString();
    await clawUpdate('approvals', approvalId, {
      status: action === 'approve' ? 'approved' : 'rejected',
      decided_at: now,
    });

    if (action === 'approve') {
      if (approval.action_type === 'send_sms' && approval.recipient_phone) {
        // Execute via edge function
        await executeSmsFromDiscord(approval.recipient_phone, approval.draft_content);
        await clawUpdate('approvals', approvalId, {
          status: 'executed',
          executed_at: new Date().toISOString(),
        });
      }

      await interaction.editReply('Approved and sent! ✅');
    } else {
      await interaction.editReply('Rejected. ❌');
    }

    // Update the original message to reflect the decision
    try {
      const originalMessage = interaction.message;
      const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
        .setColor(action === 'approve' ? 0x22c55e : 0xef4444)
        .setFooter({ text: action === 'approve' ? '✅ APPROVED' : '❌ REJECTED' });

      await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
    } catch { /* ignore edit failures */ }
  } catch (error) {
    console.error('[Discord] Approval handling failed:', error);
    await interaction.editReply('Failed to process. Try again.');
  }
}

/**
 * Handle batch approve via Discord button
 */
async function handleBatchApprove(interaction: any, taskId: string): Promise<void> {
  await interaction.deferReply();

  try {
    // Find all pending approvals for this task
    const approvals = await clawQuery<{
      id: string;
      action_type: string;
      draft_content: string;
      recipient_phone: string | null;
      recipient_name: string | null;
    }>('approvals', `task_id=eq.${taskId}&status=eq.pending`);

    if (approvals.length === 0) {
      await interaction.editReply('No pending approvals found for this task.');
      return;
    }

    const results: string[] = [];

    for (const approval of approvals) {
      const now = new Date().toISOString();
      await clawUpdate('approvals', approval.id, {
        status: 'approved',
        decided_at: now,
      });

      if (approval.action_type === 'send_sms' && approval.recipient_phone) {
        const sent = await executeSmsFromDiscord(approval.recipient_phone, approval.draft_content);
        if (sent) {
          await clawUpdate('approvals', approval.id, {
            status: 'executed',
            executed_at: new Date().toISOString(),
          });
          results.push(`✅ Sent to ${approval.recipient_name || approval.recipient_phone}`);
        } else {
          results.push(`⚠️ Approved but send failed: ${approval.recipient_name || approval.recipient_phone}`);
        }
      } else {
        results.push(`✅ Approved: ${approval.recipient_name || 'Unknown'}`);
      }
    }

    await interaction.editReply(`Done! ${results.join('\n')}`);

    // Update the original message
    try {
      const originalMessage = interaction.message;
      const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
        .setColor(0x22c55e)
        .setFooter({ text: '✅ ALL APPROVED' });
      await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
    } catch { /* ignore */ }
  } catch (error) {
    console.error('[Discord] Batch approve failed:', error);
    await interaction.editReply('Failed to process batch approval. Try again.');
  }
}

/**
 * Send a briefing as a rich Discord embed
 */
async function sendBriefingEmbed(channel: any, content: string): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('Morning Briefing')
    .setDescription(content.slice(0, 4096))
    .setColor(0x6366f1) // indigo
    .setTimestamp()
    .setFooter({ text: 'The Claw — Your AI Business Assistant' });

  await channel.send({ embeds: [embed] });
}

/**
 * Send approvals as Discord embeds with action buttons
 */
async function sendApprovalsEmbed(
  channel: any,
  userId: string,
  response: { message: string; task_id?: string; approvals_created?: number }
): Promise<void> {
  // First, send the summary
  await channel.send(response.message);

  if (!response.task_id) return;

  // Fetch the actual approval details
  const approvals = await clawQuery<{
    id: string;
    title: string;
    draft_content: string;
    recipient_name: string | null;
    recipient_phone: string | null;
  }>('approvals', `task_id=eq.${response.task_id}&status=eq.pending&order=created_at.asc`);

  if (approvals.length === 0) return;

  // Create embeds for each approval
  for (let i = 0; i < approvals.length; i++) {
    const approval = approvals[i];

    const embed = new EmbedBuilder()
      .setTitle(`Draft #${i + 1}: ${approval.recipient_name || 'Unknown'}`)
      .setDescription(approval.draft_content)
      .setColor(0xeab308) // yellow = pending
      .addFields(
        { name: 'To', value: approval.recipient_phone || 'N/A', inline: true },
        { name: 'Status', value: '⏳ Pending', inline: true }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_${approval.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_${approval.id}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });
  }

  // Add an "Approve All" button
  if (approvals.length > 1) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_all_${response.task_id}`)
        .setLabel('Approve All')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`skip_all_${response.task_id}`)
        .setLabel('Skip All')
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ content: `${approvals.length} drafts above. What would you like to do?`, components: [row] });
  }
}

/**
 * Check if a response looks like a briefing
 */
function isBriefingResponse(message: string): boolean {
  const briefingIndicators = ['Portfolio', 'Deals:', 'Follow-up', 'Bookings', 'Brief', 'Summary'];
  return briefingIndicators.filter((indicator) => message.includes(indicator)).length >= 2;
}

/**
 * Send a message via Discord (used by broadcast system)
 */
async function sendDiscordMessage(content: string, userId: string, channelConfig: Record<string, unknown>): Promise<boolean> {
  if (!discordClient || !isReady) return false;

  const channelId = (channelConfig.channel_id as string) || config.discordChannelId;
  if (!channelId) return false;

  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel?.send) return false;

    if (content.length > 2000) {
      // Split long messages
      const chunks = splitMessage(content, 2000);
      for (const chunk of chunks) {
        await channel.send(chunk);
      }
    } else {
      await channel.send(content);
    }

    return true;
  } catch (error) {
    console.error('[Discord] Send failed:', error);
    return false;
  }
}

/**
 * Split long messages into chunks
 */
function splitMessage(content: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = content;

  while (remaining.length > maxLength) {
    // Find a good split point (newline or space)
    let splitAt = remaining.lastIndexOf('\n', maxLength);
    if (splitAt === -1 || splitAt < maxLength / 2) {
      splitAt = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitAt === -1) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

/**
 * Resolve a Discord user ID to a Supabase user ID
 */
async function resolveDiscordUser(discordUserId: string): Promise<string | null> {
  const prefs = await clawQuery<{ user_id: string }>(
    'channel_preferences',
    `channel=eq.discord&channel_config->>discord_user_id=eq.${discordUserId}&is_enabled=eq.true&limit=1`
  );

  if (prefs[0]) {
    discordUserMap.set(discordUserId, prefs[0].user_id);
    return prefs[0].user_id;
  }

  return null;
}

/**
 * Save Discord config to channel_preferences
 */
async function saveDiscordConfig(userId: string, discordUserId: string, channelId: string): Promise<void> {
  try {
    // Update or insert via REST PATCH with upsert
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/channel_preferences?user_id=eq.${userId}&channel=eq.discord`,
      {
        method: 'PATCH',
        headers: {
          apikey: config.supabaseServiceKey,
          Authorization: `Bearer ${config.supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'claw',
        },
        body: JSON.stringify({
          is_enabled: true,
          channel_config: { discord_user_id: discordUserId, channel_id: channelId },
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error('[Discord] Failed to save config:', await response.text());
    }
  } catch (error) {
    console.error('[Discord] Config save failed:', error);
  }
}

/**
 * Execute SMS from Discord approval
 */
async function executeSmsFromDiscord(recipientPhone: string, content: string): Promise<boolean> {
  const result = await callEdgeFunction('twilio-sms', {
    to: recipientPhone,
    body: content,
  });
  if (!result.ok) {
    console.error(`[Discord] SMS send failed: ${result.error}`);
  }
  return result.ok;
}

/**
 * Get the Discord client (for external use)
 */
export function getDiscordClient(): any {
  return discordClient;
}
