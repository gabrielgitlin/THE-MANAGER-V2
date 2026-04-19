import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID } from "../constants.js";

export function registerLegalTools(server: McpServer): void {
  server.registerTool(
    "manager_list_legal_documents",
    {
      title: "List Legal Documents",
      description: `List legal documents and contracts in The Manager.

Args:
  - type: Filter by document type (e.g. "contract", "license", "release", "agreement")
  - status: Filter by "Draft", "Pending", or "Signed"
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Document list with id, title, type, status, signed/expiry dates`,
      inputSchema: z.object({
        type: z.string().optional().describe("Document type filter"),
        status: z.string().optional().describe("Status filter (e.g. 'Draft', 'Signed')"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ type, status, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("legal_documents")
          .select("id,title,type,status,signed_date,expiry_date,notes,created_at")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (type) query = query.eq("type", type);
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const docs = data ?? [];
        if (docs.length === 0) return { content: [{ type: "text", text: "No legal documents found." }] };

        const statusIcon: Record<string, string> = {
          Signed: "✅", signed: "✅",
          Draft: "📝", draft: "📝",
          Pending: "✍️", pending: "✍️"
        };

        const lines = [`# Legal Documents (${docs.length})`, ""];
        for (const d of docs) {
          const icon = statusIcon[d.status] ?? "📄";
          lines.push(`${icon} **${d.title}** [${d.type}]`);
          lines.push(`  - **ID**: ${d.id}`);
          lines.push(`  - **Status**: ${d.status}`);
          if (d.signed_date) lines.push(`  - **Signed**: ${d.signed_date}`);
          if (d.expiry_date) lines.push(`  - **Expires**: ${d.expiry_date}`);
          if (d.notes) lines.push(`  - **Notes**: ${d.notes}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
