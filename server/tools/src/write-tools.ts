// Supabase MCP Server — Write tools
// 9 write tools for creating/updating CRM data.
// Write tools are marked as elevated in agent config (require human approval).

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { schemaQuery, schemaInsert, schemaUpdate, assertUuid, assertModule } from "./db.js";

/** Standard MCP tool response */
function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function err(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true as const };
}

const userIdSchema = z.string().uuid().describe("The user's UUID");

export function registerWriteTools(server: McpServer): void {
  // draft_sms — Draft an SMS/WhatsApp message (does not send)
  server.tool(
    "draft_sms",
    "Draft an SMS/WhatsApp message for a contact. Does not send — create an approval after.",
    {
      user_id: userIdSchema,
      recipient_name: z.string().describe("Name of the recipient"),
      recipient_phone: z.string().describe("Phone number of the recipient"),
      message: z.string().describe("The message content to draft"),
      context: z.string().optional().describe("Why this message is being sent"),
    },
    async ({ user_id, recipient_name, recipient_phone, message, context }) => {
      return ok({
        recipient_name,
        recipient_phone,
        draft_content: message,
        context: context || "",
      });
    }
  );

  // create_approval — Create an approval entry for human review
  server.tool(
    "create_approval",
    "Create an approval entry for human review before executing an action.",
    {
      user_id: userIdSchema,
      task_id: z.string().uuid().describe("Associated task ID"),
      agent_run_id: z.string().uuid().optional(),
      action_type: z.string().describe("Type of action (send_sms, send_email, etc.)"),
      title: z.string().describe("Human-readable title for the approval"),
      description: z.string().optional(),
      draft_content: z.string().describe("The drafted content to approve"),
      recipient_name: z.string().optional(),
      recipient_phone: z.string().optional(),
      recipient_email: z.string().optional(),
      action_payload: z.record(z.unknown()).optional().describe("Additional action data"),
    },
    async ({ user_id, task_id, agent_run_id, action_type, title, description, draft_content, recipient_name, recipient_phone, recipient_email, action_payload }) => {
      try {
        const result = await schemaInsert("claw", "approvals", {
          user_id,
          task_id,
          agent_run_id: agent_run_id || null,
          status: "pending",
          action_type,
          title,
          description: description || null,
          draft_content,
          recipient_name: recipient_name || null,
          recipient_phone: recipient_phone || null,
          recipient_email: recipient_email || null,
          action_payload: action_payload || {},
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
        return ok(result);
      } catch (e) {
        return err("Failed to create approval");
      }
    }
  );

  // create_lead — Create a new lead in crm.contacts
  server.tool(
    "create_lead",
    "Create a new lead/contact in CRM.",
    {
      user_id: userIdSchema,
      first_name: z.string().describe("First name of the lead"),
      last_name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      source: z.string().optional().describe("Lead source (default: manual)"),
      status: z.string().optional().describe("Lead status (default: new)"),
      score: z.number().optional().describe("Lead score 0-100 (default: 50)"),
      city: z.string().optional(),
      state: z.string().optional(),
      tags: z.array(z.string()).optional(),
      module: z.string().optional().describe("investor or landlord (default: investor)"),
    },
    async ({ user_id, first_name, last_name, phone, email, source, status, score, city, state, tags, module }) => {
      try {
        const result = await schemaInsert("crm", "contacts", {
          user_id,
          first_name,
          last_name: last_name || null,
          phone: phone || null,
          email: email || null,
          source: source || "manual",
          status: status || "new",
          score: score || 50,
          city: city || null,
          state: state || null,
          tags: tags || [],
          metadata: {},
          module: assertModule(module),
        });
        return ok(result);
      } catch (e) {
        return err("Failed to create lead");
      }
    }
  );

  // update_lead — Update an existing lead in crm.contacts
  server.tool(
    "update_lead",
    "Update a lead/contact status, score, or details.",
    {
      user_id: userIdSchema,
      contact_id: z.string().uuid().describe("The contact to update"),
      status: z.string().optional(),
      score: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ user_id, contact_id, status, score, phone, email, tags }) => {
      try {
        // Verify ownership
        const existing = await schemaQuery<{ id: string }>(
          "crm", "contacts",
          `id=eq.${contact_id}&user_id=eq.${user_id}&select=id&limit=1`
        );
        if (existing.length === 0) return err("Contact not found or access denied");

        const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (status !== undefined) data.status = status;
        if (score !== undefined) data.score = score;
        if (phone !== undefined) data.phone = phone;
        if (email !== undefined) data.email = email;
        if (tags !== undefined) data.tags = tags;

        await schemaUpdate("crm", "contacts", contact_id, data);
        return ok({ success: true, contact_id });
      } catch (e) {
        return err("Failed to update lead");
      }
    }
  );

  // update_deal_stage — Move a deal to a new pipeline stage
  server.tool(
    "update_deal_stage",
    "Move a deal to a new pipeline stage.",
    {
      user_id: userIdSchema,
      deal_id: z.string().uuid().describe("The deal to update"),
      stage: z.string().describe("New pipeline stage"),
      next_action: z.string().optional().describe("Next action to take"),
      next_action_due: z.string().optional().describe("Due date for next action (ISO date)"),
    },
    async ({ user_id, deal_id, stage, next_action, next_action_due }) => {
      try {
        // Verify ownership
        const existing = await schemaQuery<{ id: string }>(
          "investor", "deals_pipeline",
          `id=eq.${deal_id}&user_id=eq.${user_id}&select=id&limit=1`
        );
        if (existing.length === 0) return err("Deal not found or access denied");

        const data: Record<string, unknown> = {
          stage,
          updated_at: new Date().toISOString(),
        };
        if (next_action) data.next_action = next_action;
        if (next_action_due) data.next_action_due = next_action_due;

        await schemaUpdate("investor", "deals_pipeline", deal_id, data);
        return ok({ success: true, deal_id, new_stage: stage });
      } catch (e) {
        return err("Failed to update deal stage");
      }
    }
  );

  // mark_followup_complete — Mark a follow-up as completed
  server.tool(
    "mark_followup_complete",
    "Mark a follow-up as completed.",
    {
      user_id: userIdSchema,
      followup_id: z.string().uuid().describe("The follow-up to complete"),
    },
    async ({ user_id, followup_id }) => {
      try {
        // Verify ownership
        const existing = await schemaQuery<{ id: string }>(
          "investor", "follow_ups",
          `id=eq.${followup_id}&user_id=eq.${user_id}&select=id&limit=1`
        );
        if (existing.length === 0) return err("Follow-up not found or access denied");

        await schemaUpdate("investor", "follow_ups", followup_id, {
          status: "completed",
          updated_at: new Date().toISOString(),
        });
        return ok({ success: true, followup_id });
      } catch (e) {
        return err("Failed to mark follow-up complete");
      }
    }
  );

  // send_whatsapp — Draft a WhatsApp message (creates draft, requires approval to send)
  server.tool(
    "send_whatsapp",
    "Draft a WhatsApp message. Must create approval to actually send.",
    {
      user_id: userIdSchema,
      recipient_name: z.string(),
      recipient_phone: z.string(),
      message: z.string(),
      context: z.string().optional(),
    },
    async ({ recipient_name, recipient_phone, message, context }) => {
      return ok({
        channel: "whatsapp",
        recipient_name,
        recipient_phone,
        draft_content: message,
        context: context || "",
        note: "Create an approval entry to send this message",
      });
    }
  );

  // send_email — Draft an email (creates draft, requires approval to send)
  server.tool(
    "send_email",
    "Draft an email. Must create approval to actually send.",
    {
      user_id: userIdSchema,
      recipient_name: z.string(),
      recipient_email: z.string(),
      subject: z.string(),
      body: z.string(),
      context: z.string().optional(),
    },
    async ({ recipient_name, recipient_email, subject, body, context }) => {
      return ok({
        channel: "email",
        recipient_name,
        recipient_email,
        subject,
        draft_content: body,
        context: context || "",
        note: "Create an approval entry to send this email",
      });
    }
  );

  // add_note — Add a note to a deal, lead, property, or maintenance record
  server.tool(
    "add_note",
    "Add a note to a deal, lead, property, or maintenance record.",
    {
      user_id: userIdSchema,
      target_type: z.enum(["deal", "lead", "property", "maintenance"]).describe("What to attach the note to"),
      target_id: z.string().uuid().describe("ID of the target record"),
      note: z.string().describe("Note content"),
    },
    async ({ user_id, target_type, target_id, note }) => {
      try {
        const mapping: Record<string, { schema: string; table: string; field: string }> = {
          deal: { schema: "investor", table: "deals_pipeline", field: "notes" },
          lead: { schema: "crm", table: "contacts", field: "metadata" },
          property: { schema: "investor", table: "properties", field: "notes" },
          maintenance: { schema: "landlord", table: "maintenance_records", field: "notes" },
        };

        const target = mapping[target_type];
        if (!target) return err(`Unknown target type: ${target_type}`);

        if (target.field === "metadata") {
          // For contacts: append note to metadata.notes array
          const contacts = await schemaQuery<{ metadata: Record<string, unknown> }>(
            target.schema, target.table,
            `id=eq.${target_id}&user_id=eq.${user_id}&select=metadata&limit=1`
          );
          if (contacts.length === 0) return err(`${target_type} not found or access denied`);

          const existing = contacts[0].metadata || {};
          const notes = Array.isArray(existing.notes) ? existing.notes : [];
          notes.push({ text: note, created_at: new Date().toISOString() });
          await schemaUpdate(target.schema, target.table, target_id, {
            metadata: { ...existing, notes },
            updated_at: new Date().toISOString(),
          });
        } else {
          // For text fields, append with timestamp
          const records = await schemaQuery<{ notes: string | null }>(
            target.schema, target.table,
            `id=eq.${target_id}&user_id=eq.${user_id}&select=notes&limit=1`
          );
          if (records.length === 0) return err(`${target_type} not found or access denied`);

          const existingNotes = records[0].notes || "";
          const separator = existingNotes ? "\n\n" : "";
          const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
          await schemaUpdate(target.schema, target.table, target_id, {
            notes: `${existingNotes}${separator}[${timestamp}] ${note}`,
            updated_at: new Date().toISOString(),
          });
        }

        return ok({ success: true, target_type, target_id });
      } catch (e) {
        return err("Failed to add note");
      }
    }
  );

  // create_maintenance_request — Create a maintenance request
  server.tool(
    "create_maintenance_request",
    "Create a new maintenance request for a rental property.",
    {
      user_id: userIdSchema,
      property_id: z.string().uuid().describe("Property UUID"),
      title: z.string().describe("Short description of the issue"),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("Priority level (default: medium)"),
      category: z.string().optional().describe("Category (plumbing, electrical, etc.)"),
      location: z.string().optional().describe("Location within the property"),
    },
    async ({ user_id, property_id, title, description, priority, category, location }) => {
      try {
        // Verify property ownership
        const property = await schemaQuery<{ id: string }>(
          "landlord", "properties",
          `id=eq.${property_id}&user_id=eq.${user_id}&select=id&limit=1`
        );
        if (property.length === 0) return err("Property not found or access denied");

        const result = await schemaInsert("landlord", "maintenance_records", {
          user_id,
          property_id,
          title,
          description: description || null,
          priority: priority || "medium",
          category: category || "general",
          location: location || null,
          status: "reported",
          reported_at: new Date().toISOString(),
        });
        return ok(result);
      } catch (e) {
        return err("Failed to create maintenance request");
      }
    }
  );
}
