// Supabase MCP Server — Read tools
// 12 read-only tools for querying CRM data across schemas.
// All tools require user_id and clamp limit to max 50.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { schemaQuery, clampLimit, assertUuid, assertModule } from "./db.js";

/** Standard MCP tool response */
function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function err(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true as const };
}

const userIdSchema = z.string().uuid().describe("The user's UUID");

export function registerReadTools(server: McpServer): void {
  // read_deals — Active deals from investor.deals_pipeline
  server.tool(
    "read_deals",
    "Read active deals from the investment pipeline. Filter by stage optionally.",
    {
      user_id: userIdSchema,
      limit: z.number().optional().describe("Max results (default 20, max 50)"),
      stage: z.string().optional().describe("Filter by pipeline stage"),
    },
    async ({ user_id, limit, stage }) => {
      try {
        const lim = clampLimit(limit, 20);
        let params = `user_id=eq.${user_id}&status=eq.active&select=id,title,stage,estimated_value,probability,expected_close_date,next_action,next_action_due,created_at&order=updated_at.desc&limit=${lim}`;
        if (stage) params += `&stage=eq.${encodeURIComponent(stage)}`;
        return ok(await schemaQuery("investor", "deals_pipeline", params));
      } catch (e) {
        return err("Failed to read deals");
      }
    }
  );

  // read_leads — Leads/contacts from crm.contacts
  server.tool(
    "read_leads",
    "Read leads and contacts from CRM. Filter by recency or module (investor/landlord).",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      recent_days: z.number().optional().describe("Only leads created in the last N days"),
      module: z.string().optional().describe("investor or landlord (default: investor)"),
    },
    async ({ user_id, limit, recent_days, module }) => {
      try {
        const lim = clampLimit(limit, 20);
        const mod = assertModule(module);
        let params = `user_id=eq.${user_id}&module=eq.${mod}&select=id,first_name,last_name,email,phone,source,status,created_at&order=created_at.desc&limit=${lim}`;
        if (recent_days) {
          const since = new Date(Date.now() - recent_days * 86400000).toISOString();
          params += `&created_at=gte.${since}`;
        }
        return ok(await schemaQuery("crm", "contacts", params));
      } catch (e) {
        return err("Failed to read leads");
      }
    }
  );

  // read_bookings — Bookings from landlord.bookings
  server.tool(
    "read_bookings",
    "Read bookings from rental properties. Defaults to upcoming only.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      upcoming_only: z.boolean().optional().describe("Only future bookings (default: true)"),
    },
    async ({ user_id, limit, upcoming_only }) => {
      try {
        const lim = clampLimit(limit, 20);
        let params = `user_id=eq.${user_id}&select=id,contact_id,property_id,room_id,booking_type,start_date,end_date,check_in_time,check_out_time,rate,rate_type,total_amount,status,source,notes&order=start_date.asc&limit=${lim}`;
        if (upcoming_only !== false) {
          const today = new Date().toISOString().split("T")[0];
          params += `&start_date=gte.${today}`;
        }
        return ok(await schemaQuery("landlord", "bookings", params));
      } catch (e) {
        return err("Failed to read bookings");
      }
    }
  );

  // read_follow_ups — Follow-ups from investor.follow_ups
  server.tool(
    "read_follow_ups",
    "Read pending follow-ups. Filter by overdue or upcoming days.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      overdue_only: z.boolean().optional().describe("Only overdue follow-ups"),
      upcoming_days: z.number().optional().describe("Follow-ups in the next N days"),
    },
    async ({ user_id, limit, overdue_only, upcoming_days }) => {
      try {
        const lim = clampLimit(limit, 20);
        const today = new Date().toISOString().split("T")[0];
        let params = `user_id=eq.${user_id}&status=eq.scheduled&select=id,contact_id,deal_id,follow_up_type,scheduled_at,context,created_at&order=scheduled_at.asc&limit=${lim}`;
        if (overdue_only) {
          params += `&scheduled_at=lt.${today}`;
        } else if (upcoming_days) {
          const until = new Date(Date.now() + upcoming_days * 86400000).toISOString().split("T")[0];
          params += `&scheduled_at=gte.${today}&scheduled_at=lte.${until}`;
        }
        return ok(await schemaQuery("investor", "follow_ups", params));
      } catch (e) {
        return err("Failed to read follow-ups");
      }
    }
  );

  // read_maintenance — Maintenance records from landlord.maintenance_records
  server.tool(
    "read_maintenance",
    "Read maintenance requests for rental properties. Filter by status.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      status: z.string().optional().describe("Filter by status (reported, in_progress, completed)"),
    },
    async ({ user_id, limit, status }) => {
      try {
        const lim = clampLimit(limit, 20);
        let params = `user_id=eq.${user_id}&select=id,property_id,title,description,category,location,status,priority,reported_at,scheduled_at,vendor_name,vendor_phone,estimated_cost,actual_cost,notes&order=reported_at.desc&limit=${lim}`;
        if (status) params += `&status=eq.${encodeURIComponent(status)}`;
        return ok(await schemaQuery("landlord", "maintenance_records", params));
      } catch (e) {
        return err("Failed to read maintenance records");
      }
    }
  );

  // read_vendors — Vendors from landlord.vendors
  server.tool(
    "read_vendors",
    "Read property vendors and service providers. Filter by category.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      category: z.string().optional().describe("Filter by vendor category"),
    },
    async ({ user_id, limit, category }) => {
      try {
        const lim = clampLimit(limit, 20);
        let params = `user_id=eq.${user_id}&is_active=eq.true&select=id,name,company_name,category,phone,email,hourly_rate,rating,total_jobs,last_used_at,availability_notes&order=rating.desc.nullslast&limit=${lim}`;
        if (category) params += `&category=eq.${encodeURIComponent(category)}`;
        return ok(await schemaQuery("landlord", "vendors", params));
      } catch (e) {
        return err("Failed to read vendors");
      }
    }
  );

  // read_contacts_detail — Full contact details from crm.contacts
  server.tool(
    "read_contacts_detail",
    "Read full contact details from CRM. Search by name or get specific contact by ID.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      search: z.string().optional().describe("Search by name or company"),
      contact_id: z.string().uuid().optional().describe("Get a specific contact by UUID"),
      module: z.string().optional().describe("investor or landlord (default: investor)"),
    },
    async ({ user_id, limit, search, contact_id, module }) => {
      try {
        if (contact_id) {
          return ok(await schemaQuery("crm", "contacts",
            `id=eq.${contact_id}&user_id=eq.${user_id}&select=id,first_name,last_name,email,phone,company,source,status,tags,city,state,zip,preferred_channel,best_contact_time,is_do_not_contact,module,metadata,created_at,updated_at`
          ));
        }
        const lim = clampLimit(limit, 10);
        const mod = assertModule(module);
        let params = `user_id=eq.${user_id}&module=eq.${mod}&select=id,first_name,last_name,email,phone,company,source,status,tags,city,state,preferred_channel,is_do_not_contact,module,created_at&order=created_at.desc&limit=${lim}`;
        if (search) {
          const s = encodeURIComponent(search);
          params += `&or=(first_name.ilike.*${s}*,last_name.ilike.*${s}*,company.ilike.*${s}*)`;
        }
        return ok(await schemaQuery("crm", "contacts", params));
      } catch (e) {
        return err("Failed to read contacts");
      }
    }
  );

  // read_portfolio — Investment properties from investor.properties
  server.tool(
    "read_portfolio",
    "Read investment properties portfolio with financial details.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
    },
    async ({ user_id, limit }) => {
      try {
        const lim = clampLimit(limit, 20);
        return ok(await schemaQuery("investor", "properties",
          `user_id=eq.${user_id}&select=id,address_line_1,city,state,zip,property_type,bedrooms,bathrooms,square_feet,purchase_price,arv,status,notes,created_at&order=created_at.desc&limit=${lim}`
        ));
      } catch (e) {
        return err("Failed to read portfolio");
      }
    }
  );

  // read_documents — Documents from investor.documents
  server.tool(
    "read_documents",
    "Read deal/property documents. Filter by deal_id or property_id.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      deal_id: z.string().uuid().optional(),
      property_id: z.string().uuid().optional(),
    },
    async ({ user_id, limit, deal_id, property_id }) => {
      try {
        const lim = clampLimit(limit, 20);
        let params = `user_id=eq.${user_id}&select=id,title,type,property_id,deal_id,file_url,content_type,created_at&order=created_at.desc&limit=${lim}`;
        if (deal_id) params += `&deal_id=eq.${deal_id}`;
        if (property_id) params += `&property_id=eq.${property_id}`;
        return ok(await schemaQuery("investor", "documents", params));
      } catch (e) {
        return err("Failed to read documents");
      }
    }
  );

  // read_comps — Comparable properties from investor.comps
  server.tool(
    "read_comps",
    "Read comparable property sales. Filter by property_id.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      property_id: z.string().uuid().optional(),
    },
    async ({ user_id, limit, property_id }) => {
      try {
        const lim = clampLimit(limit, 10);
        let params = `created_by=eq.${user_id}&select=id,property_id,address,city,state,bedrooms,bathrooms,square_feet,sale_price,sale_date,price_per_sqft,days_on_market,distance&order=sale_date.desc&limit=${lim}`;
        if (property_id) params += `&property_id=eq.${property_id}`;
        return ok(await schemaQuery("investor", "comps", params));
      } catch (e) {
        return err("Failed to read comps");
      }
    }
  );

  // read_campaigns — Marketing campaigns from investor.campaigns
  server.tool(
    "read_campaigns",
    "Read marketing campaigns with performance metrics.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
      status: z.string().optional(),
    },
    async ({ user_id, limit, status }) => {
      try {
        const lim = clampLimit(limit, 10);
        let params = `user_id=eq.${user_id}&select=id,name,campaign_type,status,budget,spent,cost_per_lead,leads_generated,deals_closed,enrolled_count,responded_count,start_date,end_date&order=created_at.desc&limit=${lim}`;
        if (status) params += `&status=eq.${encodeURIComponent(status)}`;
        return ok(await schemaQuery("investor", "campaigns", params));
      } catch (e) {
        return err("Failed to read campaigns");
      }
    }
  );

  // read_conversations — Recent conversations from investor.conversations
  server.tool(
    "read_conversations",
    "Read recent conversation history across channels.",
    {
      user_id: userIdSchema,
      limit: z.number().optional(),
    },
    async ({ user_id, limit }) => {
      try {
        const lim = clampLimit(limit, 20);
        return ok(await schemaQuery("investor", "conversations",
          `user_id=eq.${user_id}&select=id,contact_id,channel,last_message,last_message_at,status,unread_count&order=last_message_at.desc&limit=${lim}`
        ));
      } catch (e) {
        return err("Failed to read conversations");
      }
    }
  );
}
