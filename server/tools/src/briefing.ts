// Supabase MCP Server — Briefing tool
// Pulls from the same data sources as the mobile app:
//   Pipeline: crm.leads | investor.deals_pipeline | investor.portfolio_entries
//   Follow-ups: investor.follow_ups (overdue + upcoming)
//   Bookings: landlord.bookings (today + upcoming)
//   Maintenance: landlord.maintenance_records (open)
//   Inbox: investor.conversations + investor.ai_queue_items

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { schemaQuery } from "./db.js";

/** Extract value from a settled promise, returning fallback on rejection */
function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === "fulfilled") return result.value;
  console.error("[Briefing] Query failed, using fallback:", result.reason);
  return fallback;
}

export function registerBriefingTool(server: McpServer): void {
  server.tool(
    "generate_briefing",
    "Generate a morning briefing from all data sources. Returns structured data for the agent to format naturally.",
    {
      user_id: z.string().uuid().describe("The user's UUID"),
    },
    async ({ user_id }) => {
      try {
        const data = await generateBriefingData(user_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
      } catch (e) {
        console.error("[Briefing] Failed:", e);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "Failed to generate briefing" }) }],
          isError: true as const,
        };
      }
    }
  );
}

interface BriefingData {
  leads: Array<{ id: string; name: string; status: string }>;
  leadsSummary: { total: number; new: number; contacted: number; qualified: number };
  dealsSummary: {
    total_active: number;
    total_value: number;
    stages: Record<string, number>;
    needsAction: Array<{
      id: string; title: string; lead_name: string | null;
      next_action: string | null; next_action_due: string | null;
    }>;
  };
  followUps: Array<{
    id: string; contact_name: string; follow_up_type: string;
    scheduled_at: string; context: Record<string, unknown> | null;
  }>;
  bookings: Array<{
    id: string; property_id: string; start_date: string; end_date: string;
    booking_type: string; status: string;
  }>;
  maintenance: Array<{
    id: string; title: string; status: string;
    priority: string | null; category: string | null; property_id: string | null;
  }>;
  portfolio: { totalProperties: number; totalValue: number };
  inbox: { unreadConversations: number; pendingAiResponses: number };
}

async function generateBriefingData(userId: string): Promise<BriefingData> {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Run all queries in parallel — partial failures produce partial briefings
  const results = await Promise.allSettled([
    // 0: crm.leads
    schemaQuery<{ id: string; name: string; status: string }>(
      "crm", "leads",
      `user_id=eq.${userId}&is_deleted=eq.false&module=eq.investor&select=id,name,status&order=created_at.desc&limit=50`
    ),
    // 1: investor.deals_pipeline — active
    schemaQuery<{
      id: string; title: string; stage: string; status: string;
      estimated_value: number | null; lead_id: string | null;
      next_action: string | null; next_action_due: string | null;
    }>(
      "investor", "deals_pipeline",
      `user_id=eq.${userId}&status=eq.active&select=id,title,stage,status,estimated_value,lead_id,next_action,next_action_due&order=created_at.desc`
    ),
    // 2: investor.portfolio_entries
    schemaQuery<{ id: string; property_id: string; acquisition_price: number | null }>(
      "investor", "portfolio_entries",
      `user_id=eq.${userId}&is_active=eq.true&select=id,property_id,acquisition_price`
    ),
    // 3: investor.deals_pipeline — closed_won
    schemaQuery<{ id: string; estimated_value: number | null }>(
      "investor", "deals_pipeline",
      `user_id=eq.${userId}&stage=eq.closed_won&status=eq.active&select=id,estimated_value`
    ),
    // 4: investor.conversations
    schemaQuery<{ id: string; unread_count: number; status: string }>(
      "investor", "conversations",
      `user_id=eq.${userId}&status=eq.active&select=id,unread_count,status`
    ),
    // 5: investor.ai_queue_items
    schemaQuery<{ id: string; conversation_id: string }>(
      "investor", "ai_queue_items",
      `user_id=eq.${userId}&status=eq.pending&select=id,conversation_id`
    ),
    // 6: investor.follow_ups — overdue
    schemaQuery<{
      id: string; contact_id: string; follow_up_type: string;
      scheduled_at: string; context: Record<string, unknown> | null;
    }>(
      "investor", "follow_ups",
      `user_id=eq.${userId}&status=eq.scheduled&scheduled_at=lt.${today}&select=id,contact_id,follow_up_type,scheduled_at,context&order=scheduled_at.asc&limit=10`
    ),
    // 7: investor.follow_ups — upcoming (next 7 days)
    schemaQuery<{
      id: string; contact_id: string; follow_up_type: string;
      scheduled_at: string; context: Record<string, unknown> | null;
    }>(
      "investor", "follow_ups",
      `user_id=eq.${userId}&status=eq.scheduled&scheduled_at=gte.${today}&scheduled_at=lte.${nextWeek}&select=id,contact_id,follow_up_type,scheduled_at,context&order=scheduled_at.asc&limit=10`
    ),
    // 8: landlord.bookings — next 7 days
    schemaQuery<{
      id: string; property_id: string; start_date: string; end_date: string;
      booking_type: string; status: string;
    }>(
      "landlord", "bookings",
      `user_id=eq.${userId}&start_date=gte.${today}&start_date=lte.${nextWeek}&select=id,property_id,start_date,end_date,booking_type,status&order=start_date.asc&limit=10`
    ),
    // 9: landlord.maintenance_records — open
    schemaQuery<{
      id: string; title: string; status: string;
      priority: string | null; category: string | null; property_id: string | null;
    }>(
      "landlord", "maintenance_records",
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
        "crm", "contacts",
        `id=in.(${contactIds.join(",")})&user_id=eq.${userId}&select=id,first_name,last_name`
      );
      for (const c of contactResults) {
        contactNames[c.id] = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
      }
    } catch (e) {
      console.error("[Briefing] Failed to resolve contact names:", e);
    }
  }

  // Resolve lead names for deals needing action
  const dealsNeedingAction = activeDeals.filter((d) => d.next_action).slice(0, 5);
  const leadIds = [...new Set(dealsNeedingAction.map((d) => d.lead_id).filter(Boolean))] as string[];
  const leadNames: Record<string, string> = {};
  if (leadIds.length > 0) {
    try {
      const leadResults = await schemaQuery<{ id: string; name: string }>(
        "crm", "leads",
        `id=in.(${leadIds.join(",")})&user_id=eq.${userId}&select=id,name`
      );
      for (const l of leadResults) {
        leadNames[l.id] = l.name || "Unknown";
      }
    } catch (e) {
      console.error("[Briefing] Failed to resolve lead names:", e);
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

  return {
    leads: leads.slice(0, 10).map((l) => ({ id: l.id, name: l.name || "Unknown", status: l.status })),
    leadsSummary: {
      total: leads.length,
      new: leadsByStatus["new"] || 0,
      contacted: leadsByStatus["contacted"] || 0,
      qualified: leadsByStatus["qualified"] || 0,
    },
    dealsSummary: {
      total_active: activeDeals.length,
      total_value: totalValue,
      stages,
      needsAction: dealsNeedingAction.map((d) => ({
        id: d.id,
        title: d.title || "Untitled Deal",
        lead_name: d.lead_id ? (leadNames[d.lead_id] || null) : null,
        next_action: d.next_action,
        next_action_due: d.next_action_due,
      })),
    },
    followUps: allFollowUps.map((f) => ({
      id: f.id,
      contact_name: contactNames[f.contact_id] || "Unknown",
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
      totalProperties: portfolioEntries.length + closedWonDeals.length,
      totalValue: portfolioValue,
    },
    inbox: {
      unreadConversations: conversations.filter((c) => c.unread_count > 0).length,
      pendingAiResponses: pendingAiItems.length,
    },
  };
}
