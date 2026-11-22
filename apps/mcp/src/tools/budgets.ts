import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID, USER_ID } from "../constants.js";

export function registerBudgetTools(server: McpServer): void {
  // ── Create Budget ─────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_budget",
    {
      title: "Create Budget",
      description: `Create a new budget in The Manager (for a release, show, or tour). Requires MANAGER_ARTIST_ID.

Args:
  - title: Budget title (required)
  - type: "release", "show", "tour", or "other" (required)
  - status: "planning", "in_progress", or "completed" (default "planning")
  - show_id: Link to a show UUID
  - start_date: Start date (ISO 8601)
  - end_date: End date (ISO 8601)

Returns: Created budget ID`,
      inputSchema: z.object({
        title: z.string().min(1),
        type: z.enum(["release", "show", "tour", "other"]),
        status: z.enum(["planning", "in_progress", "completed", "cancelled"]).default("planning"),
        show_id: z.string().optional().describe("Link to a show UUID"),
        start_date: z.string().optional(),
        end_date: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, type, status, show_id, start_date, end_date }) => {
      if (!ARTIST_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_ARTIST_ID is required to create budgets." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { title, type, status, artist_id: ARTIST_ID };
        if (show_id) payload.show_id = show_id;
        if (start_date) payload.start_date = start_date;
        if (end_date) payload.end_date = end_date;

        const { data, error } = await sb.from("budgets").insert(payload).select("id,title,type,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Budget created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Type**: ${data.type}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Budgets ──────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_budgets",
    {
      title: "List Budgets",
      description: `List budgets from The Manager (show, release, or tour budgets).

Args:
  - type: Filter by "release", "show", "tour", or "other"
  - status: Filter by "planning", "in_progress", or "completed"
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Budget list with id, title, type, status`,
      inputSchema: z.object({
        type: z.enum(["release", "show", "tour", "other"]).optional(),
        status: z.enum(["planning", "in_progress", "completed", "cancelled"]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ type, status, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("budgets")
          .select("id,title,type,status,created_at")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (type) query = query.eq("type", type);
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const budgets = data ?? [];
        if (budgets.length === 0) return { content: [{ type: "text", text: "No budgets found." }] };

        const lines = [`# Budgets (${budgets.length})`, ""];
        for (const b of budgets) {
          lines.push(`## ${b.title} [${b.type}]`);
          lines.push(`- **ID**: ${b.id}`);
          lines.push(`- **Status**: ${b.status}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Get Budget ────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_get_budget",
    {
      title: "Get Budget Details",
      description: `Get a budget with all its line items — income, expenses, and net balance.

Args:
  - budget_id: Budget UUID

Returns: Budget summary with all line items, total income, total expenses, net balance`,
      inputSchema: z.object({
        budget_id: z.string().describe("Budget UUID")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ budget_id }) => {
      try {
        const sb = getSupabase();
        const [budgetRes, itemsRes] = await Promise.all([
          sb.from("budgets").select("*").eq("id", budget_id).single(),
          sb.from("budget_items").select("*").eq("budget_id", budget_id).order("date", { ascending: true })
        ]);

        if (budgetRes.error) return { content: [{ type: "text", text: handleSupabaseError(budgetRes.error) }] };

        const budget = budgetRes.data;
        const items = itemsRes.data ?? [];

        const income = items.filter(i => i.type === "Income");
        const expenses = items.filter(i => i.type === "Expense");
        const totalIncome = income.reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
        const totalExpenses = expenses.reduce((sum, i) => sum + Number(i.amount ?? 0), 0);
        const net = totalIncome - totalExpenses;

        const lines = [`# ${budget.title} [${budget.type}]`, `Status: ${budget.status}`, ""];
        lines.push(`**Total Income**: $${totalIncome.toLocaleString()}`);
        lines.push(`**Total Expenses**: $${totalExpenses.toLocaleString()}`);
        lines.push(`**Net**: $${net.toLocaleString()}`, "");

        if (income.length > 0) {
          lines.push("## Income");
          for (const i of income) {
            lines.push(`- ${i.description} — $${Number(i.amount ?? 0).toLocaleString()} [${i.status}]${i.notes ? ` — ${i.notes}` : ""}`);
          }
          lines.push("");
        }

        if (expenses.length > 0) {
          lines.push("## Expenses");
          for (const i of expenses) {
            lines.push(`- ${i.description} — $${Number(i.amount ?? 0).toLocaleString()} [${i.status}]${i.notes ? ` — ${i.notes}` : ""}`);
          }
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Add Budget Item ───────────────────────────────────────────────────────────
  server.registerTool(
    "manager_add_budget_item",
    {
      title: "Add Budget Item",
      description: `Add an income or expense line item to a budget.

Args:
  - budget_id: Budget UUID (required)
  - description: Line item description (required)
  - type: "Income" or "Expense" (required)
  - amount: Dollar amount (positive number, required)
  - category: Item category (e.g. "Marketing", "Music", "Art", "Press", "Digital", "Other")
  - date: Transaction date (ISO 8601) — defaults to today
  - status: "pending", "paid", "received", or "unpaid" (default "pending")
  - notes: Optional notes

Returns: Created item ID and summary`,
      inputSchema: z.object({
        budget_id: z.string().describe("Budget UUID"),
        description: z.string().describe("Item description"),
        type: z.enum(["Income", "Expense"]),
        amount: z.number().positive().describe("Dollar amount"),
        category: z.string().default("Other").describe("Item category"),
        date: z.string().optional().describe("Date (ISO 8601), defaults to today"),
        status: z.enum(["pending", "paid", "received", "unpaid"]).default("pending"),
        notes: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ budget_id, description, type, amount, category, date, status, notes }) => {
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = {
          budget_id,
          description,
          type,
          amount,
          category,
          status,
          date: date ?? new Date().toISOString().split("T")[0]
        };
        if (notes) payload.notes = notes;

        const { data, error } = await sb.from("budget_items").insert(payload).select("id,description,type,amount,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Budget item added!\n- **ID**: ${data.id}\n- **Description**: ${data.description}\n- **Type**: ${data.type}\n- **Amount**: $${Number(data.amount).toLocaleString()}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Contacts ─────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_contacts",
    {
      title: "List Contacts",
      description: `List contacts from The Manager's contact database.

Args:
  - category: Filter by "collaborator", "crew", "business", or "other"
  - search: Search by first name, last name, or email (partial match)
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Contacts with id, name, email, phone, role, category`,
      inputSchema: z.object({
        category: z.enum(["collaborator", "crew", "business", "other"]).optional(),
        search: z.string().optional().describe("Search by name or email"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ category, search, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("contacts")
          .select("id,first_name,last_name,email,phone,role,category")
          .order("last_name", { ascending: true })
          .range(offset, offset + limit - 1);

        if (USER_ID) query = query.eq("user_id", USER_ID);
        if (category) query = query.eq("category", category);
        if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const contacts = data ?? [];
        if (contacts.length === 0) return { content: [{ type: "text", text: "No contacts found." }] };

        const lines = [`# Contacts (${contacts.length})`, ""];
        for (const c of contacts) {
          const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || "(no name)";
          lines.push(`## ${name}`);
          lines.push(`- **ID**: ${c.id}`);
          if (c.email) lines.push(`- **Email**: ${c.email}`);
          if (c.phone) lines.push(`- **Phone**: ${c.phone}`);
          if (c.role) lines.push(`- **Role**: ${c.role}`);
          if (c.category) lines.push(`- **Category**: ${c.category}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Contact ────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_contact",
    {
      title: "Create Contact",
      description: `Add a new contact to The Manager. Requires MANAGER_USER_ID to be set.

Args:
  - first_name: First name (required)
  - last_name: Last name
  - email: Email address
  - phone: Phone number
  - role: Job title / role (e.g. "Tour Manager", "Sound Engineer")
  - category: "collaborator", "crew", "business", or "other" (default "other")
  - city: City
  - country: Country

Returns: Created contact ID`,
      inputSchema: z.object({
        first_name: z.string().min(1),
        last_name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        category: z.enum(["collaborator", "crew", "business", "other"]).default("other"),
        city: z.string().optional(),
        country: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ first_name, last_name, email, phone, role, category, city, country }) => {
      if (!USER_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_USER_ID environment variable is required to create contacts. Add it to your MCP server config." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = {
          first_name,
          last_name: last_name ?? "",
          category,
          user_id: USER_ID,
          social_links: {},
          pro_affiliations: [],
          publisher_affiliations: [],
          tags: []
        };
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
        if (role) payload.role = role;
        if (city) payload.city = city;
        if (country) payload.country = country;

        const { data, error } = await sb.from("contacts").insert(payload).select("id,first_name,last_name,email,role").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Contact created!\n- **ID**: ${data.id}\n- **Name**: ${data.first_name} ${data.last_name ?? ""}\n- **Email**: ${data.email ?? "—"}\n- **Role**: ${data.role ?? "—"}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
