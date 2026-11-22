import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID, USER_ID } from "../constants.js";

export function registerCatalogTools(server: McpServer): void {
  // ── List Albums ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_albums",
    {
      title: "List Albums",
      description: `List albums in The Manager catalog.

Args:
  - format: Filter by "Album", "EP", or "Single"
  - status: Filter by status (e.g. "Released", "In Production", "demo", "draft")
  - limit: Max results (default 20, max 50)
  - offset: Pagination offset

Returns: Albums with id, title, format, status, release date, artwork URL`,
      inputSchema: z.object({
        format: z.enum(["Album", "EP", "Single"]).optional(),
        status: z.string().optional().describe("Filter by status (Released, In Production, demo, draft)"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ format, status, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("albums")
          .select("id,title,format,status,release_date,artwork_url,label")
          .order("release_date", { ascending: false, nullsFirst: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (format) query = query.eq("format", format);
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const albums = data ?? [];
        if (albums.length === 0) return { content: [{ type: "text", text: "No albums found." }] };

        const formatIcon: Record<string, string> = { Album: "💿", EP: "📀", Single: "🎵" };
        const lines = [`# Albums (${albums.length})`, ""];
        for (const a of albums) {
          const icon = formatIcon[a.format] ?? "🎵";
          lines.push(`${icon} **${a.title}** [${a.format}]`);
          lines.push(`  - ID: ${a.id}`);
          lines.push(`  - Status: ${a.status}`);
          if (a.release_date) lines.push(`  - Release: ${a.release_date}`);
          if (a.label) lines.push(`  - Label: ${a.label}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Get Album ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_get_album",
    {
      title: "Get Album Details",
      description: `Get full details for an album including its track listing.

Args:
  - album_id: Album UUID

Returns: Album metadata plus all tracks with title, track number, duration, ISRC`,
      inputSchema: z.object({
        album_id: z.string().describe("Album UUID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ album_id }) => {
      try {
        const sb = getSupabase();
        const [albumRes, tracksRes] = await Promise.all([
          sb.from("albums").select("*").eq("id", album_id).single(),
          sb.from("tracks").select("id,title,track_number,duration,isrc,audio_url").eq("album_id", album_id).order("track_number", { ascending: true })
        ]);

        if (albumRes.error) return { content: [{ type: "text", text: handleSupabaseError(albumRes.error) }] };

        const album = albumRes.data;
        const tracks = tracksRes.data ?? [];

        const lines = [`# ${album.title}`, ""];
        lines.push(`**Format**: ${album.format}`);
        lines.push(`**Status**: ${album.status}`);
        if (album.release_date) lines.push(`**Release Date**: ${album.release_date}`);
        if (album.label) lines.push(`**Label**: ${album.label}`);
        lines.push("");

        if (tracks.length > 0) {
          lines.push("## Tracks");
          for (const t of tracks) {
            const mins = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : "";
            lines.push(`${t.track_number}. **${t.title}**${mins ? ` — ${mins}` : ""}${t.isrc ? ` (${t.isrc})` : ""}`);
            lines.push(`   ID: ${t.id}`);
          }
        } else {
          lines.push("_No tracks added yet._");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Album ──────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_album",
    {
      title: "Create Album",
      description: `Create a new album in The Manager catalog. Requires MANAGER_ARTIST_ID to be set.

Args:
  - title: Album title (required)
  - format: "Album", "EP", or "Single" (default "Single")
  - status: "draft", "In Production", or "Released" (default "draft")
  - release_date: Release date (ISO 8601, e.g. "2025-10-01")
  - label: Record label name
  - upc: UPC barcode

Returns: Created album ID`,
      inputSchema: z.object({
        title: z.string().min(1).describe("Album title"),
        format: z.enum(["Album", "EP", "Single"]).default("Single"),
        status: z.string().default("draft").describe("Status: draft, In Production, Released"),
        release_date: z.string().optional().describe("Release date (ISO 8601)"),
        label: z.string().optional(),
        upc: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, format, status, release_date, label, upc }) => {
      if (!ARTIST_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_ARTIST_ID environment variable is required to create albums." }] };
      }
      if (!USER_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_USER_ID environment variable is required to create albums." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { title, format, status, artist_id: ARTIST_ID, user_id: USER_ID };
        if (release_date) payload.release_date = release_date;
        if (label) payload.label = label;
        if (upc) payload.upc = upc;

        const { data, error } = await sb.from("albums").insert(payload).select("id,title,format,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Album created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Format**: ${data.format}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Search Tracks ─────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_search_tracks",
    {
      title: "Search Tracks",
      description: `Search for tracks across all albums in The Manager catalog.

Args:
  - query: Search by track title (partial match)
  - album_id: Filter tracks to a specific album UUID
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Tracks with id, title, album title, track number, duration, ISRC`,
      inputSchema: z.object({
        query: z.string().optional().describe("Search by track title"),
        album_id: z.string().optional().describe("Filter to a specific album UUID"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ query, album_id, limit, offset }) => {
      try {
        const sb = getSupabase();
        let q = sb
          .from("tracks")
          .select("id,title,track_number,duration,isrc,album_id,albums!inner(title,artist_id)")
          .order("title", { ascending: true })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) q = q.eq("albums.artist_id", ARTIST_ID);
        if (album_id) q = q.eq("album_id", album_id);
        if (query) q = q.ilike("title", `%${query}%`);

        const { data, error } = await q;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const tracks = data ?? [];
        if (tracks.length === 0) return { content: [{ type: "text", text: "No tracks found." }] };

        const lines = [`# Tracks (${tracks.length})`, ""];
        for (const t of tracks) {
          const album = t.albums as unknown as { title: string } | null;
          const mins = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : "";
          lines.push(`🎵 **${t.title}**`);
          lines.push(`  - ID: ${t.id}`);
          if (album) lines.push(`  - Album: ${album.title}`);
          lines.push(`  - Track #${t.track_number}${mins ? ` · ${mins}` : ""}${t.isrc ? ` · ISRC: ${t.isrc}` : ""}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Update Album ──────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_update_album",
    {
      title: "Update Album",
      description: `Update an existing album's metadata.

Args:
  - album_id: Album UUID (required)
  - title: New title
  - status: New status (e.g. "Released", "In Production")
  - release_date: New release date (ISO 8601)
  - label: Record label
  - format: "Album", "EP", or "Single"

Returns: Confirmation`,
      inputSchema: z.object({
        album_id: z.string().describe("Album UUID"),
        title: z.string().optional(),
        status: z.string().optional(),
        release_date: z.string().optional(),
        label: z.string().optional(),
        format: z.enum(["Album", "EP", "Single"]).optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ album_id, ...updates }) => {
      try {
        const sb = getSupabase();
        const payload = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        const { data, error } = await sb.from("albums").update(payload).eq("id", album_id).select("id,title,format,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Album updated.\n- **Title**: ${data.title}\n- **Format**: ${data.format}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
