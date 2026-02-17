// The Claw — Briefing Engine
// Pulls from the SAME data sources as the mobile app:
//   Pipeline: crm.leads | investor.deals_pipeline | investor.portfolio_entries
//   Follow-ups: investor.follow_ups (overdue + upcoming)
//   Bookings: landlord.bookings (today + upcoming)
//   Inbox: investor.conversations + investor.ai_queue_items

import { config } from '../config.js';
import { schemaQuery } from './db.js';
import { logClaudeCost } from './costs.js';
import type { BriefingData } from './types.js';

/** Extract value from a settled promise, returning fallback on rejection */
function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === 'fulfilled') return result.value;
  console.warn('[Briefing] Query failed, using fallback:', result.reason);
  return fallback;
}

/**
 * Generate a briefing from the same data the app displays.
 * Uses Promise.allSettled so partial DB failures produce partial briefings.
 */
export async function generateBriefingData(userId: string): Promise<BriefingData> {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Run all queries in parallel — partial failures are OK
  const results = await Promise.allSettled([
    // 0: crm.leads — investor module only
    schemaQuery<{
      id: string;
      name: string;
      status: string;
    }>(
      'crm',
      'leads',
      `user_id=eq.${userId}&is_deleted=eq.false&module=eq.investor&select=id,name,status&order=created_at.desc&limit=50`
    ),

    // 1: investor.deals_pipeline — active deals
    schemaQuery<{
      id: string;
      title: string;
      stage: string;
      status: string;
      estimated_value: number | null;
      lead_id: string | null;
      next_action: string | null;
      next_action_due: string | null;
    }>(
      'investor',
      'deals_pipeline',
      `user_id=eq.${userId}&status=eq.active&select=id,title,stage,status,estimated_value,lead_id,next_action,next_action_due&order=created_at.desc`
    ),

    // 2: investor.portfolio_entries
    schemaQuery<{
      id: string;
      property_id: string;
      acquisition_price: number | null;
    }>(
      'investor',
      'portfolio_entries',
      `user_id=eq.${userId}&is_active=eq.true&select=id,property_id,acquisition_price`
    ),

    // 3: investor.deals_pipeline closed_won
    schemaQuery<{
      id: string;
      estimated_value: number | null;
    }>(
      'investor',
      'deals_pipeline',
      `user_id=eq.${userId}&stage=eq.closed_won&status=eq.active&select=id,estimated_value`
    ),

    // 4: investor.conversations
    schemaQuery<{
      id: string;
      unread_count: number;
      status: string;
    }>(
      'investor',
      'conversations',
      `user_id=eq.${userId}&status=eq.active&select=id,unread_count,status`
    ),

    // 5: investor.ai_queue_items
    schemaQuery<{
      id: string;
      conversation_id: string;
    }>(
      'investor',
      'ai_queue_items',
      `user_id=eq.${userId}&status=eq.pending&select=id,conversation_id`
    ),

    // 6: investor.follow_ups — overdue (scheduled before today, still 'scheduled')
    schemaQuery<{
      id: string;
      contact_id: string;
      follow_up_type: string;
      scheduled_at: string;
      context: Record<string, unknown> | null;
    }>(
      'investor',
      'follow_ups',
      `user_id=eq.${userId}&status=eq.scheduled&scheduled_at=lt.${today}&select=id,contact_id,follow_up_type,scheduled_at,context&order=scheduled_at.asc&limit=10`
    ),

    // 7: investor.follow_ups — upcoming (next 7 days)
    schemaQuery<{
      id: string;
      contact_id: string;
      follow_up_type: string;
      scheduled_at: string;
      context: Record<string, unknown> | null;
    }>(
      'investor',
      'follow_ups',
      `user_id=eq.${userId}&status=eq.scheduled&scheduled_at=gte.${today}&scheduled_at=lte.${nextWeek}&select=id,contact_id,follow_up_type,scheduled_at,context&order=scheduled_at.asc&limit=10`
    ),

    // 8: landlord.bookings — today + upcoming (next 7 days)
    schemaQuery<{
      id: string;
      property_id: string;
      start_date: string;
      end_date: string;
      booking_type: string;
      status: string;
    }>(
      'landlord',
      'bookings',
      `user_id=eq.${userId}&start_date=gte.${today}&start_date=lte.${nextWeek}&select=id,property_id,start_date,end_date,booking_type,status&order=start_date.asc&limit=10`
    ),

    // 9: landlord.maintenance_records — open issues
    schemaQuery<{
      id: string;
      title: string;
      status: string;
      priority: string | null;
      category: string | null;
      property_id: string | null;
    }>(
      'landlord',
      'maintenance_records',
      `user_id=eq.${userId}&status=neq.completed&select=id,title,status,priority,category,property_id&order=created_at.desc&limit=10`
    ),
  ]);

  const leads = settled(results[0], []);
  const activeDeals = settled(results[1], []);
  const portfolioEntries = settled(results[2], []);
  const closedWonDeals = settled(results[3], []);
  const conversations = settled(results[4], []);
  const pendingAiItems = settled(results[5], []);
  const overdueFollowUps = settled(results[6], []);
  const upcomingFollowUps = settled(results[7], []);
  const upcomingBookings = settled(results[8], []);
  const openMaintenance = settled(results[9], []);

  // Combine follow-ups (overdue first, then upcoming)
  const allFollowUps = [...overdueFollowUps, ...upcomingFollowUps];

  // Resolve contact names for follow-ups
  const contactIds = [...new Set(allFollowUps.map((f) => f.contact_id).filter(Boolean))];
  const contactNames: Record<string, string> = {};

  if (contactIds.length > 0) {
    try {
      const contactResults = await schemaQuery<{ id: string; first_name: string; last_name: string | null }>(
        'crm', 'contacts',
        `id=in.(${contactIds.join(',')})&select=id,first_name,last_name`
      );
      for (const c of contactResults) {
        contactNames[c.id] = [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown';
      }
    } catch (err) {
      console.warn('[Briefing] Failed to resolve contact names:', err);
    }
  }

  // Resolve lead names for deals that need action
  const dealsNeedingAction = activeDeals
    .filter((d) => d.next_action)
    .slice(0, 5);

  const leadIds = [...new Set(dealsNeedingAction.map((d) => d.lead_id).filter(Boolean))] as string[];
  const leadNames: Record<string, string> = {};

  if (leadIds.length > 0) {
    try {
      const leadResults = await schemaQuery<{ id: string; name: string }>(
        'crm',
        'leads',
        `id=in.(${leadIds.join(',')})&select=id,name`
      );
      for (const l of leadResults) {
        leadNames[l.id] = l.name || 'Unknown';
      }
    } catch (err) {
      console.warn('[Briefing] Failed to resolve lead names:', err);
    }
  }

  // Compute leads summary
  const leadsByStatus: Record<string, number> = {};
  for (const lead of leads) {
    leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
  }

  // Compute deals summary
  const stages: Record<string, number> = {};
  let totalValue = 0;
  for (const deal of activeDeals) {
    stages[deal.stage] = (stages[deal.stage] || 0) + 1;
    totalValue += deal.estimated_value || 0;
  }

  // Compute portfolio value
  const portfolioValue = portfolioEntries.reduce((sum, e) => sum + (e.acquisition_price || 0), 0)
    + closedWonDeals.reduce((sum, d) => sum + (d.estimated_value || 0), 0);
  const totalProperties = portfolioEntries.length + closedWonDeals.length;

  // Compute inbox counts
  const unreadConversations = conversations.filter((c) => c.unread_count > 0).length;

  return {
    leads: leads.slice(0, 10).map((l) => ({
      id: l.id,
      name: l.name || 'Unknown',
      status: l.status,
    })),
    leadsSummary: {
      total: leads.length,
      new: leadsByStatus['new'] || 0,
      contacted: leadsByStatus['contacted'] || 0,
      qualified: leadsByStatus['qualified'] || 0,
    },
    dealsSummary: {
      total_active: activeDeals.length,
      total_value: totalValue,
      stages,
      needsAction: dealsNeedingAction.map((d) => ({
        id: d.id,
        title: d.title || 'Untitled Deal',
        lead_name: d.lead_id ? (leadNames[d.lead_id] || null) : null,
        next_action: d.next_action,
        next_action_due: d.next_action_due,
      })),
    },
    followUps: allFollowUps.map((f) => ({
      id: f.id,
      contact_name: contactNames[f.contact_id] || 'Unknown',
      follow_up_type: f.follow_up_type,
      scheduled_at: f.scheduled_at,
      context: f.context,
    })),
    bookings: upcomingBookings.map((b) => ({
      id: b.id,
      property_id: b.property_id,
      start_date: b.start_date,
      end_date: b.end_date,
      booking_type: b.booking_type,
      status: b.status,
    })),
    maintenance: openMaintenance.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      priority: m.priority,
      category: m.category,
      property_id: m.property_id,
    })),
    portfolio: {
      totalProperties,
      totalValue: portfolioValue,
    },
    inbox: {
      unreadConversations,
      pendingAiResponses: pendingAiItems.length,
    },
  };
}

/**
 * Format briefing data into a natural language summary using Claude
 */
export async function formatBriefing(
  data: BriefingData,
  anthropicApiKey: string,
  userId?: string
): Promise<string> {
  // If no API key, return a formatted text version
  if (!anthropicApiKey) {
    return formatBriefingText(data);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicApiKey, timeout: 30_000 });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: [
        {
          type: 'text' as const,
          text: `You are The Claw, a concise business briefing assistant for a real estate investor/landlord. Format the data into a natural, SMS-friendly briefing.

Lead with OVERDUE follow-ups and today's action items first — these are the most urgent.
Then deals needing action, then upcoming bookings.
Suppress raw portfolio stats and lead scores. Focus on what needs attention TODAY.
Separate investor pipeline items from landlord operations items. Use clear section headers.

Keep it under 200 words. No emojis. Use plain language, no markdown. Use line breaks between sections.`,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate a morning briefing from this data:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

    // Log cost (non-blocking)
    if (userId) {
      logClaudeCost(userId, 'claude-haiku-4-5-20251001', 'briefing_format',
        response.usage.input_tokens, response.usage.output_tokens)
        .catch((err) => console.error('[Briefing] Failed to log cost:', err));
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock?.text || formatBriefingText(data);
  } catch (error) {
    console.error('[Briefing] Claude formatting failed, using text fallback:', error);
    return formatBriefingText(data);
  }
}

/**
 * Fallback: format briefing as plain text without AI
 */
function formatBriefingText(data: BriefingData): string {
  const lines: string[] = [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  lines.push(`${greeting}. Here's your briefing:\n`);

  // Overdue follow-ups (most urgent — first)
  const overdueFollowUps = data.followUps.filter((f) => new Date(f.scheduled_at) < new Date());
  if (overdueFollowUps.length > 0) {
    lines.push('OVERDUE FOLLOW-UPS:');
    for (const f of overdueFollowUps.slice(0, 5)) {
      const daysOverdue = Math.floor((Date.now() - new Date(f.scheduled_at).getTime()) / 86400000);
      lines.push(`- ${f.contact_name} (${f.follow_up_type}) — ${daysOverdue}d overdue`);
    }
    if (overdueFollowUps.length > 5) {
      lines.push(`  ...and ${overdueFollowUps.length - 5} more`);
    }
    lines.push('');
  }

  // INVESTOR PIPELINE
  const hasInvestorData = data.dealsSummary.needsAction.length > 0 || data.leadsSummary.total > 0;
  if (hasInvestorData) {
    lines.push('INVESTOR PIPELINE:');

    // Deals needing action
    if (data.dealsSummary.needsAction.length > 0) {
      for (const d of data.dealsSummary.needsAction.slice(0, 3)) {
        const who = d.lead_name ? ` (${d.lead_name})` : '';
        lines.push(`- ${d.title}${who}: ${d.next_action}`);
      }
      if (data.dealsSummary.needsAction.length > 3) {
        lines.push(`  ...and ${data.dealsSummary.needsAction.length - 3} more`);
      }
    }

    // Pipeline summary line
    if (data.dealsSummary.total_active > 0) {
      const value = data.dealsSummary.total_value > 0
        ? ` ($${(data.dealsSummary.total_value / 1000).toFixed(0)}k)`
        : '';
      lines.push(`${data.dealsSummary.total_active} active deals${value}`);
    }

    // Leads summary line
    if (data.leadsSummary.total > 0) {
      const parts: string[] = [];
      if (data.leadsSummary.new > 0) parts.push(`${data.leadsSummary.new} new`);
      if (data.leadsSummary.qualified > 0) parts.push(`${data.leadsSummary.qualified} qualified`);
      if (parts.length > 0) lines.push(`Leads: ${parts.join(', ')}`);
    }

    lines.push('');
  }

  // LANDLORD OPERATIONS
  const hasLandlordData = data.bookings.length > 0 || data.maintenance.length > 0;
  if (hasLandlordData) {
    lines.push('LANDLORD OPERATIONS:');

    // Maintenance issues
    if (data.maintenance.length > 0) {
      for (const m of data.maintenance.slice(0, 3)) {
        const priority = m.priority ? ` [${m.priority}]` : '';
        lines.push(`- ${m.title}${priority} (${m.status})`);
      }
      if (data.maintenance.length > 3) {
        lines.push(`  ...and ${data.maintenance.length - 3} more maintenance items`);
      }
    }

    // Bookings
    if (data.bookings.length > 0) {
      for (const b of data.bookings.slice(0, 3)) {
        lines.push(`- ${b.booking_type} booking: ${b.start_date} to ${b.end_date} (${b.status})`);
      }
      if (data.bookings.length > 3) {
        lines.push(`  ...and ${data.bookings.length - 3} more bookings`);
      }
    }
    lines.push('');
  }

  // Upcoming follow-ups
  const upcomingFollowUps = data.followUps.filter((f) => new Date(f.scheduled_at) >= new Date());
  if (upcomingFollowUps.length > 0) {
    lines.push('UPCOMING:');
    for (const f of upcomingFollowUps.slice(0, 3)) {
      const date = new Date(f.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      lines.push(`- ${f.contact_name} (${f.follow_up_type}) — ${date}`);
    }
    lines.push('');
  }

  // Inbox
  if (data.inbox.unreadConversations > 0 || data.inbox.pendingAiResponses > 0) {
    lines.push('INBOX:');
    if (data.inbox.unreadConversations > 0) {
      lines.push(`- ${data.inbox.unreadConversations} unread conversation${data.inbox.unreadConversations > 1 ? 's' : ''}`);
    }
    if (data.inbox.pendingAiResponses > 0) {
      lines.push(`- ${data.inbox.pendingAiResponses} AI response${data.inbox.pendingAiResponses > 1 ? 's' : ''} waiting`);
    }
    lines.push('');
  }

  if (lines.length <= 1) {
    lines.push('All clear — nothing needs your attention right now.');
  }

  return lines.join('\n');
}
