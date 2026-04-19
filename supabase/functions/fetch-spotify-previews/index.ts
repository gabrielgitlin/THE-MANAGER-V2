import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not configured");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("Failed to get Spotify token");
  return (await response.json()).access_token;
}

/**
 * Fetches preview_url for tracks that have a spotify_id but no preview_url.
 * Spotify's /tracks endpoint (batch, up to 50) returns full track objects
 * including preview_url when available. We need to pass a market parameter
 * (e.g. "US") to maximize the chance of getting a preview.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Unauthorized");

    const spotifyToken = await getSpotifyAccessToken();

    // Find all tracks with spotify_id but no preview_url
    const { data: tracks, error: fetchError } = await supabase
      .from("tracks")
      .select("id, spotify_id")
      .not("spotify_id", "is", null)
      .or("preview_url.is.null,preview_url.eq.")
      .limit(500);

    if (fetchError) throw fetchError;
    if (!tracks || tracks.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, message: "All tracks already have preview URLs" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updated = 0;
    let noPreview = 0;

    // Batch fetch from Spotify in chunks of 50
    for (let i = 0; i < tracks.length; i += 50) {
      const chunk = tracks.slice(i, i + 50);
      const ids = chunk.map((t) => t.spotify_id).join(",");

      const response = await fetch(
        `https://api.spotify.com/v1/tracks?ids=${ids}&market=US`,
        { headers: { Authorization: `Bearer ${spotifyToken}` } }
      );

      if (!response.ok) {
        console.error("Spotify tracks fetch failed:", response.status, await response.text());
        continue;
      }

      const data = await response.json();
      const spotifyTracks = data.tracks || [];

      for (const st of spotifyTracks) {
        if (!st) continue;

        const dbTrack = chunk.find((t) => t.spotify_id === st.id);
        if (!dbTrack) continue;

        if (st.preview_url) {
          const { error: updateError } = await supabase
            .from("tracks")
            .update({ preview_url: st.preview_url })
            .eq("id", dbTrack.id);

          if (!updateError) updated++;
          else console.error("Update failed for track:", dbTrack.id, updateError);
        } else {
          noPreview++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        total: tracks.length,
        updated,
        noPreview,
        message: `Updated ${updated} tracks with preview URLs. ${noPreview} tracks have no Spotify preview available.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
