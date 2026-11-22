#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "./constants.js";
import { registerShowTools } from "./tools/shows.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerBudgetTools } from "./tools/budgets.js";
import { registerLegalTools } from "./tools/legal.js";
import { registerCatalogTools } from "./tools/catalog.js";
import { registerCrewTools } from "./tools/crew.js";
import { registerMarketingTools } from "./tools/marketing.js";

function validateEnv(): void {
  if (!SUPABASE_URL) {
    console.error("ERROR: SUPABASE_URL environment variable is required");
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.error("ERROR: SUPABASE_SERVICE_KEY environment variable is required");
    process.exit(1);
  }
}

async function main(): Promise<void> {
  validateEnv();

  const server = new McpServer({
    name: "the-manager-mcp-server",
    version: "2.0.0"
  });

  // Shows: list, get, create, update
  registerShowTools(server);

  // Tasks: list, create, update, delete + Notes: list, create
  registerTaskTools(server);

  // Budgets: create, list, get, add item + Contacts: list, create
  registerBudgetTools(server);

  // Legal documents: list
  registerLegalTools(server);

  // Catalog: list/get/create/update albums, search tracks
  registerCatalogTools(server);

  // Crew: personnel, venues, guest list, setlists
  registerCrewTools(server);

  // Marketing: campaigns, posts
  registerMarketingTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("The Manager MCP server v2.0.0 running via stdio");
}

main().catch(error => {
  console.error("Server error:", error);
  process.exit(1);
});
