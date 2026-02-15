// The Claw — Briefing Engine
// Cross-schema reads to build a business briefing from real staging data

import { config } from '../config.js';
import { schemaQuery } from './db.js';
import type { BriefingData } from './types.js';

/**
 * Generate a complete briefing for a user
 */
export async function generateBriefingData(userId: string): Promise<BriefingData> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeekStr = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

  // Run all queries in parallel
  const [
    overdueFollowUps,
    upcomingFollowUps,
    upcomingBookings,
    recentLeads,
    activeDeals,
  ] = await Promise.all([
    // Overdue follow-ups from investor schema (no FK to deals_pipeline, resolved separately)
    schemaQuery<{
      id: string;
      contact_id: string | null;
      follow_up_type: string;
      scheduled_at: string;
      deal_id: string | null;
    }>(
      'investor',
      'follow_ups',
      `user_id=eq.${userId}&scheduled_at=lt.${todayStr}&status=eq.scheduled&select=id,contact_id,follow_up_type,scheduled_at,deal_id&order=scheduled_at.asc&limit=10`
    ),

    // Upcoming follow-ups (next 7 days)
    schemaQuery<{
      id: string;
      contact_id: string | null;
      follow_up_type: string;
      scheduled_at: string;
      deal_id: string | null;
    }>(
      'investor',
      'follow_ups',
      `user_id=eq.${userId}&scheduled_at=gte.${todayStr}&scheduled_at=lte.${nextWeekStr}&status=eq.scheduled&select=id,contact_id,follow_up_type,scheduled_at,deal_id&order=scheduled_at.asc&limit=10`
    ),

    // Upcoming bookings (next 2 weeks) from landlord schema
    schemaQuery<{
      id: string;
      contact_id: string | null;
      start_date: string;
      end_date: string;
      status: string;
      property_id: string;
      properties?: { name: string };
    }>(
      'landlord',
      'bookings',
      `user_id=eq.${userId}&start_date=gte.${todayStr}&start_date=lte.${new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0]}&select=id,contact_id,start_date,end_date,status,property_id,properties(name)&order=start_date.asc&limit=10`
    ),

    // Recent leads (last 2 days) from crm schema
    schemaQuery<{
      id: string;
      first_name: string;
      last_name: string;
      source: string;
      score: number | null;
      created_at: string;
    }>(
      'crm',
      'contacts',
      `user_id=eq.${userId}&created_at=gte.${twoDaysAgo}&select=id,first_name,last_name,source,score,created_at&order=created_at.desc&limit=10`
    ),

    // Active deals from investor schema
    schemaQuery<{
      id: string;
      title: string;
      stage: string;
      estimated_value: number;
      status: string;
    }>(
      'investor',
      'deals_pipeline',
      `user_id=eq.${userId}&status=eq.active&select=id,title,stage,estimated_value,status`
    ),
  ]);

  // Resolve contact names and deal titles via batch lookups (no FK joins available)
  const contactIds = new Set<string>();
  const dealIds = new Set<string>();
  for (const f of [...overdueFollowUps, ...upcomingFollowUps]) {
    if (f.contact_id) contactIds.add(f.contact_id);
    if (f.deal_id) dealIds.add(f.deal_id);
  }
  for (const b of upcomingBookings) {
    if (b.contact_id) contactIds.add(b.contact_id);
  }

  const contactNames: Record<string, string> = {};
  const dealTitles: Record<string, string> = {};

  // Run both resolution queries in parallel
  const [contactResults, dealResults] = await Promise.all([
    contactIds.size > 0
      ? schemaQuery<{ id: string; first_name: string; last_name: string }>(
          'crm',
          'contacts',
          `id=in.(${Array.from(contactIds).join(',')})&select=id,first_name,last_name`
        )
      : Promise.resolve([]),
    dealIds.size > 0
      ? schemaQuery<{ id: string; title: string }>(
          'investor',
          'deals_pipeline',
          `id=in.(${Array.from(dealIds).join(',')})&select=id,title`
        )
      : Promise.resolve([]),
  ]);

  for (const c of contactResults) {
    contactNames[c.id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown';
  }
  for (const d of dealResults) {
    dealTitles[d.id] = d.title || 'Untitled Deal';
  }

  // Compute deals summary
  const stages: Record<string, number> = {};
  let totalValue = 0;
  for (const deal of activeDeals) {
    stages[deal.stage] = (stages[deal.stage] || 0) + 1;
    totalValue += deal.estimated_value || 0;
  }

  return {
    overdueTasks: overdueFollowUps.map((f) => ({
      id: f.id,
      contact_name: (f.contact_id && contactNames[f.contact_id]) || 'Unknown',
      type: f.follow_up_type || 'follow_up',
      due_date: f.scheduled_at,
      deal_name: f.deal_id ? dealTitles[f.deal_id] : undefined,
    })),
    upcomingFollowUps: upcomingFollowUps.map((f) => ({
      id: f.id,
      contact_name: (f.contact_id && contactNames[f.contact_id]) || 'Unknown',
      type: f.follow_up_type || 'follow_up',
      due_date: f.scheduled_at,
      deal_name: f.deal_id ? dealTitles[f.deal_id] : undefined,
    })),
    upcomingBookings: upcomingBookings.map((b) => ({
      id: b.id,
      guest_name: (b.contact_id && contactNames[b.contact_id]) || 'Guest',
      property_name: b.properties?.name || 'Unknown Property',
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
    })),
    recentLeads: recentLeads.map((l) => ({
      id: l.id,
      name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
      source: l.source || 'unknown',
      score: l.score,
      created_at: l.created_at,
    })),
    dealsSummary: {
      total_active: activeDeals.length,
      total_value: totalValue,
      stages,
    },
    unreadMessages: 0,
  };
}

/**
 * Format briefing data into a natural language summary using Claude
 */
export async function formatBriefing(
  data: BriefingData,
  anthropicApiKey: string
): Promise<string> {
  // If no API key, return a formatted text version
  if (!anthropicApiKey) {
    return formatBriefingText(data);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: anthropicApiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `You are The Claw, a concise business briefing assistant. Format the following data into a natural, SMS-friendly briefing. Lead with the most actionable items. Use line breaks between sections. Keep it under 300 words. No emojis.`,
      messages: [
        {
          role: 'user',
          content: `Generate a morning briefing from this data:\n${JSON.stringify(data, null, 2)}`,
        },
      ],
    });

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

  // Overdue
  if (data.overdueTasks.length > 0) {
    lines.push(`OVERDUE (${data.overdueTasks.length}):`);
    for (const t of data.overdueTasks.slice(0, 3)) {
      lines.push(`- ${t.contact_name}: ${t.type} (due ${t.due_date})${t.deal_name ? ` — ${t.deal_name}` : ''}`);
    }
    if (data.overdueTasks.length > 3) {
      lines.push(`  ...and ${data.overdueTasks.length - 3} more`);
    }
    lines.push('');
  }

  // Upcoming follow-ups
  if (data.upcomingFollowUps.length > 0) {
    lines.push(`FOLLOW-UPS THIS WEEK (${data.upcomingFollowUps.length}):`);
    for (const f of data.upcomingFollowUps.slice(0, 3)) {
      lines.push(`- ${f.contact_name}: ${f.type} (${f.due_date})${f.deal_name ? ` — ${f.deal_name}` : ''}`);
    }
    lines.push('');
  }

  // Bookings
  if (data.upcomingBookings.length > 0) {
    lines.push(`BOOKINGS (${data.upcomingBookings.length}):`);
    for (const b of data.upcomingBookings.slice(0, 3)) {
      lines.push(`- ${b.guest_name} @ ${b.property_name}: ${b.start_date} → ${b.end_date} (${b.status})`);
    }
    lines.push('');
  }

  // New leads
  if (data.recentLeads.length > 0) {
    lines.push(`NEW LEADS (${data.recentLeads.length}):`);
    for (const l of data.recentLeads.slice(0, 3)) {
      lines.push(`- ${l.name} via ${l.source}${l.score ? ` (score: ${l.score})` : ''}`);
    }
    lines.push('');
  }

  // Deals summary
  if (data.dealsSummary.total_active > 0) {
    lines.push(`PIPELINE: ${data.dealsSummary.total_active} active deals ($${(data.dealsSummary.total_value / 1000).toFixed(0)}k)`);
  }

  if (lines.length <= 1) {
    lines.push('All clear — no overdue tasks, upcoming follow-ups, or new leads. Enjoy your day!');
  }

  lines.push('\nReply "draft follow ups" to send messages to warm leads.');

  return lines.join('\n');
}
