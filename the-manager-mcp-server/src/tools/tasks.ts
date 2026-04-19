import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSupabase, handleSupabaseError, truncate } from "../services/supabase.js";
import { CHARACTER_LIMIT, ARTIST_ID, USER_ID } from "../constants.js";

export function registerTaskTools(server: McpServer): void {
  // ── List Tasks ────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_tasks",
    {
      title: "List Tasks",
      description: `List tasks from The Manager. Filter by status, priority, or show.

Args:
  - status: "Todo", "In Progress", or "Done"
  - priority: "Low", "Medium", or "High"
  - show_id: Filter tasks linked to a specific show UUID
  - include_completed: Include Done tasks (default false)
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Task list with id, title, priority, status, due date`,
      inputSchema: z.object({
        status: z.enum(["Todo", "In Progress", "Done"]).optional(),
        priority: z.enum(["Low", "Medium", "High"]).optional(),
        show_id: z.string().optional().describe("Filter by show UUID"),
        include_completed: z.boolean().default(false).describe("Include Done tasks"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ status, priority, show_id, include_completed, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("tasks")
          .select("id,title,description,status,priority,due_date,completed")
          .order("due_date", { ascending: true, nullsFirst: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (status) query = query.eq("status", status);
        if (priority) query = query.eq("priority", priority);
        if (show_id) query = query.eq("show_id", show_id);
        if (!include_completed) query = query.neq("status", "Done");

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const tasks = data ?? [];
        if (tasks.length === 0) return { content: [{ type: "text", text: "No tasks found." }] };

        const priorityIcon: Record<string, string> = { High: "🔴", Medium: "🟡", Low: "🟢" };
        const lines = [`# Tasks (${tasks.length})`, ""];
        for (const t of tasks) {
          const icon = priorityIcon[t.priority as string] ?? "⚪";
          lines.push(`${icon} **${t.title}** [${t.status}]`);
          lines.push(`  - ID: ${t.id}`);
          if (t.due_date) lines.push(`  - Due: ${t.due_date}`);
          if (t.priority) lines.push(`  - Priority: ${t.priority}`);
          if (t.description) lines.push(`  - ${t.description}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Task ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_task",
    {
      title: "Create Task",
      description: `Create a new task in The Manager. Requires MANAGER_USER_ID to be set in the server environment.

Args:
  - title: Task title (required)
  - description: Optional task description
  - priority: "Low", "Medium", or "High" (default "Medium")
  - due_date: Due date (ISO 8601, e.g. "2025-08-01")
  - show_id: Link task to a show UUID

Returns: Created task ID and title`,
      inputSchema: z.object({
        title: z.string().min(1).describe("Task title"),
        description: z.string().optional(),
        priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
        due_date: z.string().optional().describe("Due date (ISO 8601)"),
        show_id: z.string().optional().describe("Show UUID to link")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, description, priority, due_date, show_id }) => {
      if (!USER_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_USER_ID environment variable is required to create tasks. Add it to your MCP server config." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { title, priority, status: "Todo", completed: false, user_id: USER_ID };
        if (description) payload.description = description;
        if (due_date) payload.due_date = due_date;
        if (show_id) payload.show_id = show_id;
        if (ARTIST_ID) payload.artist_id = ARTIST_ID;

        const { data, error } = await sb.from("tasks").insert(payload).select("id,title,priority,status").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Task created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Priority**: ${data.priority}\n- **Status**: ${data.status}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Update Task ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_update_task",
    {
      title: "Update Task",
      description: `Update a task — mark it complete, change priority, or update status.

Args:
  - task_id: Task UUID (required)
  - status: "Todo", "In Progress", or "Done"
  - priority: "Low", "Medium", or "High"
  - completed: true to mark done
  - due_date: New due date (ISO 8601)
  - title: New title

Returns: Confirmation`,
      inputSchema: z.object({
        task_id: z.string().describe("Task UUID"),
        status: z.enum(["Todo", "In Progress", "Done"]).optional(),
        priority: z.enum(["Low", "Medium", "High"]).optional(),
        completed: z.boolean().optional(),
        due_date: z.string().optional(),
        title: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ task_id, ...updates }) => {
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        );
        if (payload.completed === true && !payload.status) payload.status = "Done";
        if (payload.completed === true) payload.completed_at = new Date().toISOString();

        const { data, error } = await sb.from("tasks").update(payload).eq("id", task_id).select("id,title,status,priority").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Task updated.\n- **Title**: ${data.title}\n- **Status**: ${data.status}\n- **Priority**: ${data.priority}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Delete Task ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_delete_task",
    {
      title: "Delete Task",
      description: `Permanently delete a task from The Manager.

Args:
  - task_id: Task UUID (required)

Returns: Confirmation`,
      inputSchema: z.object({
        task_id: z.string().describe("Task UUID to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
    },
    async ({ task_id }) => {
      try {
        const sb = getSupabase();
        const { error } = await sb.from("tasks").delete().eq("id", task_id);
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };
        return { content: [{ type: "text", text: `Task ${task_id} deleted.` }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── List Notes ────────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_list_notes",
    {
      title: "List Notes",
      description: `List notes from The Manager's notes board.

Args:
  - category: Filter by "todo", "meeting", "idea", or "other"
  - show_id: Filter notes linked to a specific show
  - limit: Max results (default 20)
  - offset: Pagination offset

Returns: Notes with id, title, content, category`,
      inputSchema: z.object({
        category: z.enum(["todo", "meeting", "idea", "other"]).optional(),
        show_id: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ category, show_id, limit, offset }) => {
      try {
        const sb = getSupabase();
        let query = sb
          .from("notes")
          .select("id,title,content,category,color,created_at")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (ARTIST_ID) query = query.eq("artist_id", ARTIST_ID);
        if (category) query = query.eq("category", category);
        if (show_id) query = query.eq("show_id", show_id);

        const { data, error } = await query;
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        const notes = data ?? [];
        if (notes.length === 0) return { content: [{ type: "text", text: "No notes found." }] };

        const lines = [`# Notes (${notes.length})`, ""];
        for (const n of notes) {
          lines.push(`## ${n.title || "(untitled)"} [${n.category || "other"}]`);
          lines.push(`- **ID**: ${n.id}`);
          if (n.content) lines.push(`- ${n.content}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: truncate(lines.join("\n"), CHARACTER_LIMIT) }] };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );

  // ── Create Note ───────────────────────────────────────────────────────────────
  server.registerTool(
    "manager_create_note",
    {
      title: "Create Note",
      description: `Create a new note on The Manager's notes board. Requires MANAGER_USER_ID to be set.

Args:
  - title: Note title (required)
  - content: Note body text
  - category: "todo", "meeting", "idea", or "other" (default "idea")
  - show_id: Optionally link to a show

Returns: Created note ID`,
      inputSchema: z.object({
        title: z.string().min(1).describe("Note title"),
        content: z.string().optional().describe("Note content"),
        category: z.enum(["todo", "meeting", "idea", "other"]).default("idea"),
        show_id: z.string().optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ title, content, category, show_id }) => {
      if (!USER_ID) {
        return { content: [{ type: "text", text: "Error: MANAGER_USER_ID environment variable is required to create notes. Add it to your MCP server config." }] };
      }
      try {
        const sb = getSupabase();
        const payload: Record<string, unknown> = { title, category, user_id: USER_ID, content: content ?? "" };
        if (show_id) payload.show_id = show_id;
        if (ARTIST_ID) payload.artist_id = ARTIST_ID;

        const { data, error } = await sb.from("notes").insert(payload).select("id,title,category").single();
        if (error) return { content: [{ type: "text", text: handleSupabaseError(error) }] };

        return {
          content: [{
            type: "text",
            text: `Note created!\n- **ID**: ${data.id}\n- **Title**: ${data.title}\n- **Category**: ${data.category}`
          }]
        };
      } catch (err) {
        return { content: [{ type: "text", text: handleSupabaseError(err) }] };
      }
    }
  );
}
