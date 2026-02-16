// The Claw — Briefing Engine
// Pulls from the SAME data sources as the mobile app:
//   Pipeline: crm.leads | investor.deals_pipeline | investor.portfolio_entries
//   Inbox: investor.conversations + investor.ai_queue_items

import { config } from '../config.js';
import { schemaQuery } from './db.js';
import type { BriefingData } from './types.js';

/**
 * Generate a briefing from the same data the app displays
 */
export async function generateBriefingData(userId: string): Promise<BriefingData> {
  // Run all queries in parallel — same tables as the mobile app
  const [
    leads,
    activeDeals,
    portfolioEntries,
    closedWonDeals,
    conversations,
    pendingAiItems,
  ] = await Promise.all([
    // crm.leads — same as Pipeline > Leads (useLeads hook)
    schemaQuery<{
      id: string;
      name: string;
      status: string;
      score: number | null;
    }>(
      'crm',
      'leads',
      `user_id=eq.${userId}&is_deleted=eq.false&select=id,name,status,score&order=created_at.desc&limit=50`
    ),

    // investor.deals_pipeline — same as Pipeline > Deals (getDealsWithLead RPC)
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

    // investor.portfolio_entries — same as Pipeline > Portfolio (usePortfolio hook)
    schemaQuery<{
      id: string;
      property_id: string;
      acquisition_price: number | null;
    }>(
      'investor',
      'portfolio_entries',
      `user_id=eq.${userId}&is_active=eq.true&select=id,property_id,acquisition_price`
    ),

    // investor.deals_pipeline closed_won — also part of Portfolio
    schemaQuery<{
      id: string;
      estimated_value: number | null;
    }>(
      'investor',
      'deals_pipeline',
      `user_id=eq.${userId}&stage=eq.closed_won&status=eq.active&select=id,estimated_value`
    ),

    // investor.conversations — same as Investor Inbox (useLeadInbox hook)
    schemaQuery<{
      id: string;
      unread_count: number;
      status: string;
    }>(
      'investor',
      'conversations',
      `user_id=eq.${userId}&status=eq.active&select=id,unread_count,status`
    ),

    // investor.ai_queue_items — pending AI responses (useLeadInbox hook)
    schemaQuery<{
      id: string;
      conversation_id: string;
    }>(
      'investor',
      'ai_queue_items',
      `status=eq.pending&select=id,conversation_id`
    ),
  ]);

  // Resolve lead names for deals that need action
  const dealsNeedingAction = activeDeals
    .filter((d) => d.next_action)
    .slice(0, 5);

  const leadIds = [...new Set(dealsNeedingAction.map((d) => d.lead_id).filter(Boolean))] as string[];
  const leadNames: Record<string, string> = {};

  if (leadIds.length > 0) {
    const leadResults = await schemaQuery<{ id: string; name: string }>(
      'crm',
      'leads',
      `id=in.(${leadIds.join(',')})&select=id,name`
    );
    for (const l of leadResults) {
      leadNames[l.id] = l.name || 'Unknown';
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
      score: l.score,
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
      max_tokens: 400,
      system: [
        {
          type: 'text' as const,
          text: `You are The Claw, a concise business briefing assistant for a real estate investor. Format the data into a natural, SMS-friendly briefing. Lead with the most actionable items — deals needing action, unread messages, new leads. Use line breaks between sections. Keep it under 150 words. No emojis. Use plain language, no markdown.`,
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

  // Inbox (most actionable first)
  if (data.inbox.unreadConversations > 0 || data.inbox.pendingAiResponses > 0) {
    lines.push('INBOX:');
    if (data.inbox.unreadConversations > 0) {
      lines.push(`- ${data.inbox.unreadConversations} unread conversation${data.inbox.unreadConversations > 1 ? 's' : ''}`);
    }
    if (data.inbox.pendingAiResponses > 0) {
      lines.push(`- ${data.inbox.pendingAiResponses} AI response${data.inbox.pendingAiResponses > 1 ? 's' : ''} waiting for your approval`);
    }
    lines.push('');
  }

  // Deals needing action
  if (data.dealsSummary.needsAction.length > 0) {
    lines.push('DEALS - ACTION NEEDED:');
    for (const d of data.dealsSummary.needsAction.slice(0, 3)) {
      const who = d.lead_name ? ` (${d.lead_name})` : '';
      lines.push(`- ${d.title}${who}: ${d.next_action}`);
    }
    if (data.dealsSummary.needsAction.length > 3) {
      lines.push(`  ...and ${data.dealsSummary.needsAction.length - 3} more`);
    }
    lines.push('');
  }

  // Leads summary
  if (data.leadsSummary.total > 0) {
    const parts: string[] = [`${data.leadsSummary.total} total`];
    if (data.leadsSummary.new > 0) parts.push(`${data.leadsSummary.new} new`);
    if (data.leadsSummary.qualified > 0) parts.push(`${data.leadsSummary.qualified} qualified`);
    lines.push(`LEADS: ${parts.join(', ')}`);
  }

  // Pipeline summary
  if (data.dealsSummary.total_active > 0) {
    const value = data.dealsSummary.total_value > 0
      ? ` ($${(data.dealsSummary.total_value / 1000).toFixed(0)}k)`
      : '';
    lines.push(`PIPELINE: ${data.dealsSummary.total_active} active deals${value}`);
  }

  // Portfolio
  if (data.portfolio.totalProperties > 0) {
    const value = data.portfolio.totalValue > 0
      ? ` ($${(data.portfolio.totalValue / 1000).toFixed(0)}k)`
      : '';
    lines.push(`PORTFOLIO: ${data.portfolio.totalProperties} properties${value}`);
  }

  if (lines.length <= 1) {
    lines.push('All clear — nothing needs your attention right now.');
  }

  return lines.join('\n');
}
