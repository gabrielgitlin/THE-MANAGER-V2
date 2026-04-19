import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "../constants.js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
      );
    }
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return _client;
}

export function handleSupabaseError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return `Error: ${(error as { message: string }).message}`;
  }
  return `Error: ${String(error)}`;
}

export function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + `\n\n[Response truncated at ${limit} chars. Use filters or pagination to narrow results.]`;
}
