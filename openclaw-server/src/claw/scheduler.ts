// The Claw — Scheduled Operations
// Morning briefing generation + follow-up nudge detection
// Triggered via cron endpoint or pg_cron

import { config } from '../config.js';
import { generateBriefingData, formatBriefing } from './briefing.js';
import { clawInsert, clawQuery } from './db.js';
import { sendProactiveMessage } from './broadcast.js';
import { schemaQuery } from './db.js';

/**
 * Generate and send morning briefings to all active users
 * Called by cron at configured time (default 7:30 AM EST)
 */
export async function runMorningBriefings(): Promise<{
  sent: number;
  failed: number;
  results: Array<{ userId: string; success: boolean; error?: string }>;
}> {
  console.log('[Scheduler] Starting morning briefings...');

  // Get all users with enabled channel preferences (i.e., active users)
  const activeUsers = await clawQuery<{ user_id: string }>(
    'channel_preferences',
    `is_enabled=eq.true&select=user_id&order=user_id`
  );

  // Deduplicate user IDs
  const userIds = [...new Set(activeUsers.map((u) => u.user_id))];

  if (userIds.length === 0) {
    console.log('[Scheduler] No active users found');
    return { sent: 0, failed: 0, results: [] };
  }

  const results: Array<{ userId: string; success: boolean; error?: string }> = [];

  for (const userId of userIds) {
    try {
      // Generate briefing data
      const data = await generateBriefingData(userId);
      const briefingText = await formatBriefing(data, config.anthropicApiKey);

      // Save as system message
      await clawInsert('messages', {
        user_id: userId,
        channel: 'system',
        role: 'assistant',
        content: briefingText,
        metadata: { type: 'morning_briefing', generated_at: new Date().toISOString() },
      });

      // Broadcast to all enabled channels
      const broadcastResult = await sendProactiveMessage(userId, {
        content: briefingText,
        richContent: {
          title: 'Morning Briefing',
          color: '#6366f1',
        },
      });

      const totalSent = broadcastResult.sent.length;
      if (totalSent > 0) {
        results.push({ userId, success: true });
        console.log(`[Scheduler] Briefing sent to ${userId} via ${broadcastResult.sent.join(', ')}`);
      } else {
        results.push({ userId, success: false, error: 'No channels delivered' });
      }
    } catch (error) {
      console.error(`[Scheduler] Briefing failed for ${userId}:`, error);
      results.push({
        userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`[Scheduler] Morning briefings complete: ${sent} sent, ${failed} failed`);
  return { sent, failed, results };
}

/**
 * Check for contacts that haven't responded to approved messages
 * and send nudge reminders after 48 hours
 */
export async function runFollowUpNudges(): Promise<{
  nudges_sent: number;
  results: Array<{ userId: string; contactName: string; sent: boolean }>;
}> {
  console.log('[Scheduler] Checking for follow-up nudges...');

  // Find executed approvals that are 48+ hours old without a response
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const expiredApprovals = await clawQuery<{
    id: string;
    user_id: string;
    recipient_name: string;
    recipient_phone: string;
    draft_content: string;
    executed_at: string;
  }>(
    'approvals',
    `status=eq.executed&executed_at=lt.${cutoff}&select=id,user_id,recipient_name,recipient_phone,draft_content,executed_at&order=executed_at.asc&limit=50`
  );

  // Filter out already-nudged ones (check metadata)
  const results: Array<{ userId: string; contactName: string; sent: boolean }> = [];

  for (const approval of expiredApprovals) {
    // Check if we already sent a nudge for this approval
    const existingNudges = await clawQuery<{ id: string }>(
      'messages',
      `user_id=eq.${approval.user_id}&metadata->>nudge_for_approval=eq.${approval.id}&limit=1`
    );

    if (existingNudges.length > 0) continue; // Already nudged

    const nudgeMessage = `👋 ${approval.recipient_name} hasn't responded to your message from ${new Date(approval.executed_at).toLocaleDateString()}. Want me to try a different approach, or should I mark this one as cold?`;

    // Save nudge message
    await clawInsert('messages', {
      user_id: approval.user_id,
      channel: 'system',
      role: 'assistant',
      content: nudgeMessage,
      metadata: { type: 'follow_up_nudge', nudge_for_approval: approval.id },
    });

    // Broadcast to user's channels
    await sendProactiveMessage(approval.user_id, { content: nudgeMessage });

    results.push({
      userId: approval.user_id,
      contactName: approval.recipient_name || 'Unknown',
      sent: true,
    });
  }

  console.log(`[Scheduler] Follow-up nudges: ${results.length} sent`);
  return { nudges_sent: results.length, results };
}
