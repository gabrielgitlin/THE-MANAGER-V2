import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID } from "../constants.js";

export function registerShowTools(server: McpServer): void {
  // ── List Shows ──────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_shows",
    {
      title: "List Shows",
      description: `List shows from The Manager. Supports filtering by status or date range.

Args:
  - status: Filter by show status — "Confirmed", "Pending", or "Cancelled"
  - from_date: Start of date range (ISO 8601, e.g. "2025-06-01")
  - to_date: End of date range (ISO 8601, e.g. "2025-12-31")
  - limit: Max results (default 20, max 50)
  - offset: Pagination offset (default 0)

Returns: List of shows with id, title, date, venue, city, country, status, capacity`,
      inputSchema: z.object({
        status: z.enum(["Confirmed", "Pending", "Cancelled"]).optional()
          .describe("Filter by show status"),
        from_date: z.string().optional().describe("Start date filter (ISO 8601)"),
        to_date: z.string().optional().describe("End date filter (ISO 8601)"),
        limit: z.number().int().min(1).max(50).default(20).describe("Max results"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ status, from_date, to_date, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("shows")
          .select("id,title,venue_name,venue_city,venue_country,date,doors_time,show_time,status,capacity,guarantee")
          .order("date", { ascending: true })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (status) query = query.eq("status", status);
        if (from_date) query = query.gte("date", from_date);
        if (to_date) query = query.lte("date", to_date);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const shows = data ?? [];
        if (shows.length === 0) return { content: [{ type: "text", text: "No shows found matching those filters." }] };

        const lines = [`# Shows (${shows.length})`, ""];
        for (const s of shows) {
          lines.push(`## ${s.title || s.venue_name} — ${s.date}`);
          lines.push(`- **ID**: ${s.id}`);
          lines.push(`- **Venue**: ${s.venue_name}, ${s.venue_city} ${s.venue_country}`);
          lines.push(`- **Status**: ${s.status}`);
          if (s.show_time) lines.push(`- **Show Time**: ${s.show_time}`);
          if (s.doors_time) lines.push(`- **Doors**: ${s.doors_time}`);
          if (s.capacity) lines.push(`- **Capacity**: ${s.capacity}`);
          if (s.guarantee) lines.push(`- **Guarantee**: $${Number(s.guarantee).toLocaleString()}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Get Show ──────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_get_show",
    {
      title: "Get Show Details",
      description: `Get full details for a specific show by ID, including deal terms, logistics/advances, setlist, and guest list.

Args:
  - show_id: The show's UUID

Returns: Full show record with deal (guarantee, percentage, settlement), advances (production manager, venue contact, schedule, catering), and guest list`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ show_id }) => {
      try {
        const sb = getSupabase();
        const [showRes, dealRes, advancesRes, guestsRes] = await Promise.all([
          sb.from("shows").select("*").eq("id", show_id).single(),
          sb.from("show_deals").select("*").eq("show_id", show_id).maybeSingle(),
          sb.from("show_advances").select("*").eq("show_id", show_id).maybeSingle(),
          sb.from("guest_list").select("name,guest_type,ticket_count,status").eq("show_id", show_id)
        ]);

        if (showRes.error) return { content: [{ type: "text", text: handleSupabaseError(showRes.error) }] };

        const show = showRes.data;
        const deal = dealRes.data;
        const adv = advancesRes.data;
        const guests = guestsRes.data ?? [];

        const lines = [`# ${show.title || show.venue_name} — ${show.date}`, ""];
        lines.push(`**Venue**: ${show.venue_name}, ${show.venue_city} ${show.venue_country}`);
        lines.push(`**Status**: ${show.status}`);
        if (show.show_time) lines.push(`**Show Time**: ${show.show_time}`);
        if (show.doors_time) lines.push(`**Doors**: ${show.doors_time}`);
        if (show.capacity) lines.push(`**Capacity**: ${show.capacity}`);
        if (show.guarantee) lines.push(`**Guarantee**: $${Number(show.guarantee).toLocaleString()}`);
        if (show.notes) lines.push(`**Notes**: ${show.notes}`);
        lines.push("");

        if (deal) {
          lines.push("## Deal");
          if (deal.deal_type) lines.push(`- **Type**: ${deal.deal_type}`);
          if (deal.guarantee) lines.push(`- **Guarantee**: $${Number(deal.guarantee).toLocaleString()}`);
          if (deal.percentage) lines.push(`- **Percentage**: ${deal.percentage}%`);
          lines.push("");
        }

        if (adv) {
          lines.push("## Advances / Logistics");
          if (adv.production_manager) lines.push(`- **Production Manager**: ${JSON.stringify(adv.production_manager)}`);
          if (adv.venue_contact) lines.push(`- **Venue Contact**: ${JSON.stringify(adv.venue_contact)}`);
          if (adv.schedule) lines.push(`- **Schedule**: ${JSON.stringify(adv.schedule)}`);
          lines.push("");
        }

        if (guests.length > 0) {
          lines.push("## Guest List");
          for (const g of guests) {
            lines.push(`- ${g.name} (${g.guest_type}, ${g.ticket_count} ticket${g.ticket_count !== 1 ? "s" : ""}) — ${g.status}`);
          }
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Show ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_show",
    {
      title: "Create Show",
      description: `Create a new show in The Manager.

Args:
  - title: Show title
  - date: Show date (ISO 8601, e.g. "2025-08-15") — required
  - venue_name: Venue name — required
  - venue_city: City — required
  - venue_country: Country (default "US")
  - show_time: Show time (e.g. "20:00")
  - doors_time: Doors time (e.g. "19:00")
  - capacity: Venue capacity
  - guarantee: Guaranteed payment amount
  - status: "Confirmed", "Pending", or "Cancelled" (default "Pending")

Returns: Created show ID and details`,
      inputSchema: z.object({
        title: z.string().optional().describe("Show title"),
        date: z.string().describe("Show date (ISO 8601)"),
        venue_name: z.string().describe("Venue name"),
        venue_city: z.string().describe("City"),
        venue_country: z.string().default("US").describe("Country"),
        show_time: z.string().optional().describe("Show time (e.g. '20:00')"),
        doors_time: z.string().optional().describe("Doors time (e.g. '19:00')"),
        capacity: z.number().int().positive().optional(),
        guarantee: z.number().min(0).optional(),
        status: z.enum(["Confirmed", "Pending", "Cancelled"]).default("Pending")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, date, venue_name, venue_city, venue_country, show_time, doors_time, capacity, guarantee, status }) => {
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { date, venue_name, venue_city, venue_country, status, notes: "" };
        if (title) payload.title = title;
        else payload.title = venue_name;
        if (show_time) payload.show_time = show_time;
        if (doors_time) payload.doors_time = doors_time;
        if (capacity) payload.capacity = capacity;
        if (guarantee != null) payload.guarantee = guarantee;
        if (ARTIST_ID) payload.artist_id = ARTIST_ID;

        const { data, error } = await sb.from("shows").insert(payload).select("id,title,date,venue_name,venue_city,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Show created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Date**: ${data.date}\n- **Venue**: ${data.venue_name}, ${data.venue_city}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Update Show ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_update_show",
    {
      title: "Update Show",
      description: `Update an existing show's details.

Args:
  - show_id: Show UUID (required)
  - status: "Confirmed", "Pending", or "Cancelled"
  - title: New title
  - date: New date (ISO 8601)
  - venue_name: New venue name
  - venue_city: New city
  - notes: Notes / additional info

Returns: Confirmation with updated fields`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID"),
        status: z.enum(["Confirmed", "Pending", "Cancelled"]).optional(),
        title: z.string().optional(),
        date: z.string().optional(),
        venue_name: z.string().optional(),
        venue_city: z.string().optional(),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ show_id, ...updates }) => {
      try {
        const sb = getSupabase();
        const payload = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));

        const { data, error } = await sb.from("shows").update(payload).eq("id", show_id).select("id,title,date,venue_name,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Show updated.\n- **Title**: ${data.title}\n- **Date**: ${data.date}\n- **Venue**: ${data.venue_name}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
