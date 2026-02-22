// Supabase MCP Server — Entry point
// Data spoke for OpenClaw agents. Provides read/write access to CRM data
// across claw, crm, investor, and landlord schemas.
//
// IMPORTANT: Use console.error() for logging — stdout is the MCP JSON-RPC transport.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerReadTools } from "./read-tools.js";
import { registerWriteTools } from "./write-tools.js";
import { registerBriefingTool } from "./briefing.js";

// Validate required env vars
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[supabase-mcp] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const server = new McpServer({
  name: "supabase-crm",
  version: "1.0.0",
});

registerReadTools(server);
registerWriteTools(server);
registerBriefingTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[supabase-mcp] Server running on stdio");
