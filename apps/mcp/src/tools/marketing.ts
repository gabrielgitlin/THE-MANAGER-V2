import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID, USER_ID } from "../constants.js";

export function registerMarketingTools(server: McpServer): void {
  // ── List Marketing Campaigns ──────────────────────────────────────────────────
  server.registerTool(
    "manager_list_campaigns",
    {
      title: "List Marketing Campaigns",
      description: `List marketing campaigns in The Manager.

Args:
  - status: Filter by status (e.g. "Planning", "Active", "Completed")
  - type: Filter by campaign type (e.g. "release", "tour", "single")
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Campaigns with id, title, type, platform, status, dates, budget`,
      inputSchema: z.object({
        status: z.string().optional().describe("Filter by status"),
        type: z.string().optional().describe("Filter by type (release, tour, single, etc.)"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ status, type, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("marketing_campaigns")
          .select("id,title,type,platform,status,start_date,end_date,budget,notes")
          .order("start_date", { ascending: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (status) query = query.eq("status", status);
        if (type) query = query.eq("type", type);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const campaigns = data ?? [];
        if (campaigns.length === 0) return { content: [{ type: "text", text: "No campaigns found." }] };

        const lines = [`# Marketing Campaigns (${campaigns.length})`, ""];
        for (const c of campaigns) {
          lines.push(`## ${c.title} [${c.type}]`);
          lines.push(`- **ID**: ${c.id}`);
          lines.push(`- **Status**: ${c.status}`);
          if (c.platform) lines.push(`- **Platform**: ${c.platform}`);
          if (c.start_date) lines.push(`- **Dates**: ${c.start_date}${c.end_date ? ` → ${c.end_date}` : ""}`);
          if (c.budget) lines.push(`- **Budget**: $${Number(c.budget).toLocaleString()}`);
          if (c.notes) lines.push(`- **Notes**: ${c.notes}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Marketing Campaign ─────────────────────────────────────────────────
  server.registerTool(
    "manager_create_campaign",
    {
      title: "Create Marketing Campaign",
      description: `Create a new marketing campaign in The Manager. Requires MANAGER_ARTIST_ID.

Args:
  - title: Campaign title (required)
  - type: Campaign type — e.g. "release", "tour", "single", "general" (required)
  - start_date: Start date (ISO 8601, required)
  - end_date: End date (ISO 8601)
  - platform: Platform focus (e.g. "Instagram", "All Platforms")
  - budget: Campaign budget in dollars
  - status: "Planning", "Active", or "Completed" (default "Planning")
  - notes: Campaign notes

Returns: Created campaign ID`,
      inputSchema: z.object({
        title: z.string().min(1),
        type: z.string().min(1).describe("Campaign type (release, tour, single, general)"),
        start_date: z.string().describe("Start date (ISO 8601)"),
        end_date: z.string().optional(),
        platform: z.string().optional(),
        budget: z.number().min(0).optional(),
        status: z.string().default("Planning"),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, type, start_date, end_date, platform, budget, status, notes }) => {
      if (!ARTIST_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_ARTIST_ID is required to create campaigns." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { title, type, start_date, status, artist_id: ARTIST_ID };
        if (end_date) payload.end_date = end_date;
        if (platform) payload.platform = platform;
        if (budget != null) payload.budget = budget;
        if (notes) payload.notes = notes;

        const { data, error } = await sb.from("marketing_campaigns").insert(payload).select("id,title,type,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Campaign created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Type**: ${data.type}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Marketing Posts ──────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_posts",
    {
      title: "List Marketing Posts",
      description: `List scheduled or published social media posts in The Manager.

Args:
  - platform: Filter by "instagram", "twitter", "facebook", "youtube", or "tiktok"
  - status: Filter by "draft", "scheduled", "published", or "failed"
  - from_date: Start date filter (ISO 8601)
  - to_date: End date filter (ISO 8601)
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Posts with id, title, platform, status, scheduled date, content preview`,
      inputSchema: z.object({
        platform: z.enum(["instagram", "twitter", "facebook", "youtube", "tiktok"]).optional(),
        status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
        from_date: z.string().optional().describe("Start date filter (ISO 8601)"),
        to_date: z.string().optional().describe("End date filter (ISO 8601)"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ platform, status, from_date, to_date, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("marketing_posts")
          .select("id,title,content,platform,status,scheduled_date,scheduled_time,done")
          .order("scheduled_date", { ascending: true })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (platform) query = query.eq("platform", platform);
        if (status) query = query.eq("status", status);
        if (from_date) query = query.gte("scheduled_date", from_date);
        if (to_date) query = query.lte("scheduled_date", to_date);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const posts = data ?? [];
        if (posts.length === 0) return { content: [{ type: "text", text: "No posts found." }] };

        const platformIcon: Record<string, string> = {
          instagram: "📸", twitter: "🐦", facebook: "👤", youtube: "▶️", tiktok: "🎵"
        };

        const lines = [`# Marketing Posts (${posts.length})`, ""];
        for (const p of posts) {
          const icon = platformIcon[p.platform] ?? "📱";
          lines.push(`${icon} **${p.title}** [${p.status}${p.done ? " ✓" : ""}]`);
          lines.push(`  - ID: ${p.id}`);
          lines.push(`  - Scheduled: ${p.scheduled_date} at ${p.scheduled_time}`);
          if (p.content) lines.push(`  - ${p.content.slice(0, 100)}${p.content.length > 100 ? "…" : ""}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Marketing Post ─────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_post",
    {
      title: "Create Marketing Post",
      description: `Create a new social media post in The Manager. Requires MANAGER_ARTIST_ID and MANAGER_USER_ID.

Args:
  - title: Post title/label (required)
  - content: Post copy/caption (required)
  - platform: "instagram", "twitter", "facebook", "youtube", or "tiktok" (required)
  - scheduled_date: Date to post (ISO 8601, required)
  - scheduled_time: Time to post (e.g. "14:00", default "12:00")
  - status: "draft" or "scheduled" (default "draft")

Returns: Created post ID`,
      inputSchema: z.object({
        title: z.string().min(1),
        content: z.string().min(1).describe("Post copy/caption"),
        platform: z.enum(["instagram", "twitter", "facebook", "youtube", "tiktok"]),
        scheduled_date: z.string().describe("Date to post (ISO 8601)"),
        scheduled_time: z.string().default("12:00").describe("Time to post (HH:MM)"),
        status: z.enum(["draft", "scheduled"]).default("draft")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, content, platform, scheduled_date, scheduled_time, status }) => {
      if (!ARTIST_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_ARTIST_ID is required to create posts." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = {
          title, content, platform, scheduled_date, scheduled_time, status,
          artist_id: ARTIST_ID, done: false
        };
        if (USER_ID) payload.author_id = USER_ID;

        const { data, error } = await sb.from("marketing_posts").insert(payload).select("id,title,platform,status,scheduled_date").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Post created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Platform**: ${data.platform}\n- **Scheduled**: ${data.scheduled_date}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
