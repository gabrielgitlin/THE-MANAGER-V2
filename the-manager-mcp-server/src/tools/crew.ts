import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT } from "../constants.js";

export function registerCrewTools(server: McpServer): void {
  // ── List Personnel ────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_personnel",
    {
      title: "List Personnel / Crew",
      description: `List crew and personnel in The Manager.

Args:
  - role: Filter by role (partial match, e.g. "sound", "tour manager")
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Personnel with id, name, role, email, phone, company, rate`,
      inputSchema: z.object({
        role: z.string().optional().describe("Filter by role (partial match)"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ role, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("personnel")
          .select("id,name,role,email,phone,company,rate,rate_type")
          .order("name", { ascending: true })
          .range(offset, offset + limit - 1);

        if (role) query = query.ilike("role", `%${role}%`);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const crew = data ?? [];
        if (crew.length === 0) return { content: [{ type: "text", text: "No personnel found." }] };

        const lines = [`# Personnel (${crew.length})`, ""];
        for (const p of crew) {
          lines.push(`## ${p.name}`);
          lines.push(`- **ID**: ${p.id}`);
          lines.push(`- **Role**: ${p.role}`);
          if (p.email) lines.push(`- **Email**: ${p.email}`);
          if (p.phone) lines.push(`- **Phone**: ${p.phone}`);
          if (p.company) lines.push(`- **Company**: ${p.company}`);
          if (p.rate) lines.push(`- **Rate**: $${Number(p.rate).toLocaleString()} (${p.rate_type})`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Personnel ──────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_personnel",
    {
      title: "Create Personnel / Crew Member",
      description: `Add a new crew member or personnel to The Manager.

Args:
  - name: Full name (required)
  - role: Role/title (required, e.g. "Tour Manager", "FOH Engineer", "Monitor Engineer")
  - email: Email address
  - phone: Phone number
  - company: Company or agency name
  - rate: Day rate or fee
  - rate_type: "Daily", "Weekly", "Fixed", or "Per Show" (default "Fixed")
  - notes: Additional notes

Returns: Created personnel ID`,
      inputSchema: z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        rate: z.number().min(0).optional(),
        rate_type: z.enum(["Daily", "Weekly", "Fixed", "Per Show"]).default("Fixed"),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ name, role, email, phone, company, rate, rate_type, notes }) => {
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { name, role, rate_type };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        if (company) payload.company = company;
        if (rate != null) payload.rate = rate;
        if (notes) payload.notes = notes;

        const { data, error } = await sb.from("personnel").insert(payload).select("id,name,role").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Personnel added!\n- **ID**: ${data.id}\n- **Name**: ${data.name}\n- **Role**: ${data.role}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Show Crew ────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_show_crew",
    {
      title: "List Show Crew",
      description: `List crew members assigned to a specific show.

Args:
  - show_id: Show UUID (required)

Returns: Crew list with name, role, fee, status`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ show_id }) => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from("show_personnel")
          .select("id,fee,status,personnel(name,role,email,phone)")
          .eq("show_id", show_id);

        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const crew = data ?? [];
        if (crew.length === 0) return { content: [{ type: "text", text: "No crew assigned to this show." }] };

        const lines = [`# Show Crew (${crew.length})`, ""];
        for (const c of crew) {
          const p = c.personnel as unknown as { name: string; role: string; email?: string; phone?: string } | null;
          if (!p) continue;
          lines.push(`## ${p.name} — ${p.role}`);
          lines.push(`- **Status**: ${c.status}`);
          if (c.fee) lines.push(`- **Fee**: $${Number(c.fee).toLocaleString()}`);
          if (p.email) lines.push(`- **Email**: ${p.email}`);
          if (p.phone) lines.push(`- **Phone**: ${p.phone}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Venues ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_venues",
    {
      title: "List Venues",
      description: `Search and list venues in The Manager database.

Args:
  - search: Search by venue name or city (partial match)
  - city: Filter by city
  - country: Filter by country
  - min_capacity: Minimum capacity
  - max_capacity: Maximum capacity
  - limit: Max results (default 20)

Returns: Venues with id, name, city, country, capacity, website`,
      inputSchema: z.object({
        search: z.string().optional().describe("Search by name or city"),
        city: z.string().optional(),
        country: z.string().optional(),
        min_capacity: z.number().int().optional(),
        max_capacity: z.number().int().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ search, city, country, min_capacity, max_capacity, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("venues")
          .select("id,name,city,state,country,capacity,website,address,is_verified")
          .order("usage_count", { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
        if (city) query = query.ilike("city", `%${city}%`);
        if (country) query = query.eq("country", country);
        if (min_capacity) query = query.gte("capacity", min_capacity);
        if (max_capacity) query = query.lte("capacity", max_capacity);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const venues = data ?? [];
        if (venues.length === 0) return { content: [{ type: "text", text: "No venues found." }] };

        const lines = [`# Venues (${venues.length})`, ""];
        for (const v of venues) {
          lines.push(`## ${v.name}${v.is_verified ? " ✓" : ""}`);
          lines.push(`- **ID**: ${v.id}`);
          lines.push(`- **Location**: ${v.city}${v.state ? `, ${v.state}` : ""}, ${v.country}`);
          if (v.capacity) lines.push(`- **Capacity**: ${v.capacity.toLocaleString()}`);
          if (v.website) lines.push(`- **Website**: ${v.website}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Guest List ───────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_guests",
    {
      title: "List Show Guest List",
      description: `List the guest list for a specific show.

Args:
  - show_id: Show UUID (required)
  - status: Filter by "pending", "approved", or "declined"

Returns: Guests with name, type, quantity, status, contact info`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID"),
        status: z.enum(["pending", "approved", "declined"]).optional()
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ show_id, status }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("guest_list")
          .select("id,name,type,quantity,requested_by,status,contact_info,notes,tickets_sent")
          .eq("show_id", show_id)
          .order("status", { ascending: true });

        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const guests = data ?? [];
        if (guests.length === 0) return { content: [{ type: "text", text: "No guests on the list." }] };

        const statusIcon: Record<string, string> = { approved: "✅", declined: "❌", pending: "⏳" };
        const typeLabel: Record<string, string> = {
          vip: "VIP", industry: "Industry", friends_family: "Friends & Family",
          media: "Media", other: "Other"
        };

        const lines = [`# Guest List (${guests.length})`, ""];
        for (const g of guests) {
          const icon = statusIcon[g.status] ?? "⏳";
          lines.push(`${icon} **${g.name}** — ${typeLabel[g.type] ?? g.type}`);
          lines.push(`  - ID: ${g.id}`);
          lines.push(`  - Quantity: ${g.quantity} ticket${g.quantity !== 1 ? "s" : ""}`);
          if (g.requested_by) lines.push(`  - Requested by: ${g.requested_by}`);
          if (g.contact_info) lines.push(`  - Contact: ${g.contact_info}`);
          if (g.tickets_sent) lines.push(`  - ✉️ Tickets sent`);
          if (g.notes) lines.push(`  - Notes: ${g.notes}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Add Guest ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_add_guest",
    {
      title: "Add Guest to Show",
      description: `Add a guest to a show's guest list.

Args:
  - show_id: Show UUID (required)
  - name: Guest name (required)
  - type: "vip", "industry", "friends_family", "media", or "other" (required)
  - quantity: Number of tickets (default 1)
  - requested_by: Who requested the guest
  - contact_info: Email or phone
  - notes: Additional notes

Returns: Created guest entry ID`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID"),
        name: z.string().min(1).describe("Guest name"),
        type: z.enum(["vip", "industry", "friends_family", "media", "other"]),
        quantity: z.number().int().min(1).default(1).describe("Number of tickets"),
        requested_by: z.string().optional(),
        contact_info: z.string().optional().describe("Email or phone"),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ show_id, name, type, quantity, requested_by, contact_info, notes }) => {
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { show_id, name, type, quantity, status: "pending" };
        if (requested_by) payload.requested_by = requested_by;
        if (contact_info) payload.contact_info = contact_info;
        if (notes) payload.notes = notes;

        const { data, error } = await sb.from("guest_list").insert(payload).select("id,name,type,quantity,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Guest added!\n- **ID**: ${data.id}\n- **Name**: ${data.name}\n- **Type**: ${data.type}\n- **Tickets**: ${data.quantity}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Get Setlist ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_get_setlist",
    {
      title: "Get Show Setlist",
      description: `Get the setlist for a show, including all songs in order.

Args:
  - show_id: Show UUID (required)

Returns: Setlist status and all songs in order with title, duration, encore flag`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ show_id }) => {
      try {
        const sb = getSupabase();
        const { data: setlist, error: setlistError } = await sb
          .from("setlists")
          .select("id,status,notes")
          .eq("show_id", show_id)
          .maybeSingle();

        if (setlistError) return { content: [{ type: "text", text: handleSupabaseError(setlistError) }] };
        if (!setlist) return { content: [{ type: "text", text: "No setlist found for this show." }] };

        const { data: songs, error: songsError } = await sb
          .from("setlist_songs")
          .select("position,song_title,duration,key,is_encore,notes")
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true });

        if (songsError) return { content: [{ type: "text", text: handleSupabaseError(songsError) }] };

        const songList = songs ?? [];
        const lines = [`# Setlist [${setlist.status}]`, ""];
        if (setlist.notes) lines.push(`_${setlist.notes}_`, "");

        const mainSet = songList.filter(s => !s.is_encore);
        const encore = songList.filter(s => s.is_encore);

        if (mainSet.length > 0) {
          lines.push("## Main Set");
          for (const s of mainSet) {
            lines.push(`${s.position}. **${s.song_title}**${s.duration ? ` (${s.duration})` : ""}${s.key ? ` — key: ${s.key}` : ""}`);
            if (s.notes) lines.push(`   _${s.notes}_`);
          }
          lines.push("");
        }

        if (encore.length > 0) {
          lines.push("## Encore");
          for (const s of encore) {
            lines.push(`${s.position}. **${s.song_title}**${s.duration ? ` (${s.duration})` : ""}`);
          }
          lines.push("");
        }

        if (songList.length === 0) lines.push("_No songs added yet._");

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Add Song to Setlist ───────────────────────────────────────────────────────
  server.registerTool(
    "manager_add_setlist_song",
    {
      title: "Add Song to Setlist",
      description: `Add a song to a show's setlist. Creates the setlist if one doesn't exist yet.

Args:
  - show_id: Show UUID (required)
  - song_title: Song title (required)
  - position: Position in setlist (e.g. 1, 2, 3) — appends to end if omitted
  - duration: Song duration (e.g. "4:23")
  - key: Musical key (e.g. "Am", "C#")
  - is_encore: true if this is an encore song (default false)
  - notes: Performance notes

Returns: Confirmation`,
      inputSchema: z.object({
        show_id: z.string().describe("Show UUID"),
        song_title: z.string().min(1),
        position: z.number().int().min(1).optional().describe("Position in setlist"),
        duration: z.string().optional().describe("Duration (e.g. '4:23')"),
        key: z.string().optional().describe("Musical key"),
        is_encore: z.boolean().default(false),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ show_id, song_title, position, duration, key, is_encore, notes }) => {
      try {
        const sb = getSupabase();

        // Get or create setlist
        let { data: setlist } = await sb
          .from("setlists")
          .select("id")
          .eq("show_id", show_id)
          .maybeSingle();

        if (!setlist) {
          const { data: newSetlist, error: createError } = await sb
            .from("setlists")
            .insert({ show_id, status: "draft" })
            .select("id")
            .single();
          if (createError) return { content: [{ type: "text", text: handleSupabaseError(createError) }] };
          setlist = newSetlist;
        }

        // Determine position if not provided
        let pos = position;
        if (!pos) {
          const { count } = await sb.from("setlist_songs").select("id", { count: "exact", head: true }).eq("setlist_id", setlist.id);
          pos = (count ?? 0) + 1;
        }

        const payload: Record<string, unknown> = { setlist_id: setlist.id, song_title, position: pos, is_encore };
        if (duration) payload.duration = duration;
        if (key) payload.key = key;
        if (notes) payload.notes = notes;

        const { error } = await sb.from("setlist_songs").insert(payload);
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `"${song_title}" added to setlist at position ${pos}${is_encore ? " (encore)" : ""}.`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
