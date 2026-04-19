# The Manager — MCP Server

Connect Claude to The Manager so you can prompt Claude and have actions happen in the app.

## Tools Available

| Tool | What it does |
|---|---|
| `manager_list_shows` | List shows, filter by status / tour / date |
| `manager_get_show` | Full show details — deal, logistics, guest list |
| `manager_create_show` | Create a new show |
| `manager_update_show` | Update show status, date, venue |
| `manager_list_tours` | List tours |
| `manager_create_tour` | Create a new tour |
| `manager_list_tasks` | List tasks, filter by status / priority |
| `manager_create_task` | Create a task |
| `manager_update_task` | Update / complete a task |
| `manager_list_notes` | List notes from the board |
| `manager_create_note` | Create a note |
| `manager_list_budgets` | List budgets |
| `manager_get_budget` | Budget details with all line items |
| `manager_add_budget_item` | Add income or expense to a budget |
| `manager_list_contacts` | List / search contacts |
| `manager_create_contact` | Add a new contact |
| `manager_list_legal_documents` | List contracts and legal docs |

## Setup

### 1. Get your Supabase credentials

From the Supabase dashboard for this project:
- **SUPABASE_URL** — Project URL (Settings → API → Project URL)
- **SUPABASE_SERVICE_KEY** — Service role key (Settings → API → service_role)

### 2. Build the server

```bash
cd the-manager-mcp-server
npm install
npm run build
```

### 3. Connect to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "the-manager": {
      "command": "node",
      "args": ["/absolute/path/to/the-manager-mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key",
        "MANAGER_ARTIST_ID": "your-artist-uuid"
      }
    }
  }
}
```

> **MANAGER_ARTIST_ID** is optional but recommended — it scopes all queries to your artist's data.

### 4. Connect to Claude Code

```bash
claude mcp add the-manager \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_KEY=your-service-role-key \
  -e MANAGER_ARTIST_ID=your-artist-uuid \
  -- node /absolute/path/to/the-manager-mcp-server/dist/index.js
```

## Example prompts

```
"Add a show at The Fillmore in SF on August 15th"
"Mark the Nashville task as complete"
"Create a note about the setlist ideas from rehearsal"
"Show me all pending shows this summer"
"Add a $500 travel expense to the Nashville budget"
"Who are our crew contacts?"
```
