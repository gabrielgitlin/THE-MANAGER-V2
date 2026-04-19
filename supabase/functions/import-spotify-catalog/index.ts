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

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Supabase secrets.");
  }

  const authString = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token");
  }

  const data = await response.json();
  return data.access_token;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  release_date_precision?: string;
  images: { url: string }[];
  external_urls: { spotify: string };
  total_tracks: number;
  genres?: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  track_number: number;
  disc_number: number;
  duration_ms: number;
  external_ids?: { isrc?: string };
  external_urls: { spotify: string };
  preview_url?: string;
  explicit: boolean;
}

// Spotify can return "YYYY", "YYYY-MM", or "YYYY-MM-DD". The DB column is `date`,
// so we need a full YYYY-MM-DD string or the INSERT will fail.
function normalizeReleaseDate(date: string, precision?: string): string | null {
  if (!date) return null;
  const p = precision || (date.length === 4 ? "year" : date.length === 7 ? "month" : "day");
  if (p === "year") return `${date}-01-01`;
  if (p === "month") return `${date}-01`;
  return date;
}

// Spotify's API doesn't expose "EP" as an album_type — EPs get bucketed into "single".
// We detect them by track count: a "single" release with 2–6 tracks is an EP; 1 track is a Single;
// 7+ tracks is treated as an Album.
function mapAlbumFormat(albumType: string, totalTracks: number): string {
  if (albumType === "album" || albumType === "compilation") return "Album";
  if (albumType === "single") {
    if (totalTracks <= 1) return "Single";
    if (totalTracks <= 6) return "EP";
    return "Album";
  }
  return "Single";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { spotifyArtistUrl, artistId: requestArtistId } = await req.json();

    if (!spotifyArtistUrl) {
      throw new Error("Spotify URL is required");
    }

    if (!requestArtistId) {
      throw new Error("artistId is required — imports must target an existing artist in the app");
    }

    const spotifyArtistId = extractSpotifyArtistId(spotifyArtistUrl);
    if (!spotifyArtistId) {
      throw new Error("Invalid Spotify artist URL");
    }

    const spotifyAccessToken = await getSpotifyAccessToken();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) throw new Error("Unauthorized");

    // Verify the target artist exists in our DB
    const { data: targetArtist, error: targetArtistError } = await supabase
      .from("artists")
      .select("id, name, spotify_id")
      .eq("id", requestArtistId)
      .maybeSingle();

    if (targetArtistError) throw targetArtistError;
    if (!targetArtist) {
      throw new Error(`Artist ${requestArtistId} not found`);
    }

    const artistDbId: string = targetArtist.id;

    // Fetch artist details from Spotify
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${spotifyArtistId}`,
      { headers: { Authorization: `Bearer ${spotifyAccessToken}` } }
    );

    if (!artistResponse.ok) {
      throw new Error("Failed to fetch artist from Spotify");
    }

    const artist = await artistResponse.json();
    const artistName: string = artist.name || targetArtist.name || "Unknown Artist";

    // Enrich the target artist with Spotify metadata
    const { error: artistUpdateError } = await supabase
      .from("artists")
      .update({
        name: artistName,
        spotify_id: spotifyArtistId,
        spotify_url: artist.external_urls?.spotify || null,
        image_url: artist.images?.[0]?.url || null,
        genre: artist.genres?.[0] || null,
        spotify_followers: artist.followers?.total || 0,
        spotify_popularity: artist.popularity || 0,
      })
      .eq("id", artistDbId);

    if (artistUpdateError) {
      console.error("Artist update error:", artistUpdateError);
    }

    // Resolve (or create) a Team contact for this artist — deduplicated by full name.
    // We do this once per import so all albums share the same contact reference.
    let artistContactTag: { id: string; name: string } | null = null;
    if (artistName && artistName !== "Unknown Artist") {
      const nameLower = artistName.toLowerCase();
      const nameParts = artistName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      // Load all contacts for this user (service role bypasses RLS, filter by user_id)
      const { data: existingContacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("user_id", user.id);

      const existing = (existingContacts || []).find(
        (c) => `${c.first_name} ${c.last_name}`.toLowerCase() === nameLower
      );

      if (existing) {
        artistContactTag = { id: existing.id, name: artistName };
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
            role: "Artist",
            category: "other",
            tags: [],
          })
          .select("id")
          .single();

        if (!contactError && newContact) {
          artistContactTag = { id: newContact.id, name: artistName };
        } else {
          console.error("Contact insert error:", contactError);
        }
      }
    }

    // Fetch all albums (paginated)
    let allAlbums: SpotifyAlbum[] = [];
    let nextUrl: string | null =
      `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=album,single&limit=50`;

    while (nextUrl) {
      const albumsResponse = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${spotifyAccessToken}` },
      });

      if (!albumsResponse.ok) {
        throw new Error("Failed to fetch albums from Spotify");
      }

      const albumsData = await albumsResponse.json();
      allAlbums = allAlbums.concat(albumsData.items);
      nextUrl = albumsData.next;
    }

    const importedAlbums: { title: string; tracks: number }[] = [];
    const skippedAlbums: { title: string; reason: string }[] = [];
    const failedAlbums: { title: string; reason: string }[] = [];

    for (const album of allAlbums) {
      // Skip duplicates by spotify_id
      const { data: existingAlbum } = await supabase
        .from("albums")
        .select("id")
        .eq("spotify_id", album.id)
        .maybeSingle();

      if (existingAlbum) {
        skippedAlbums.push({ title: album.name, reason: "Already imported" });
        continue;
      }

      // Fetch tracks for the album
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
        { headers: { Authorization: `Bearer ${spotifyAccessToken}` } }
      );

      if (!tracksResponse.ok) {
        failedAlbums.push({ title: album.name, reason: "Spotify tracks fetch failed" });
        continue;
      }

      const tracksData = await tracksResponse.json();
      const albumTracks: SpotifyTrack[] = tracksData.items || [];

      // Insert album — use the actual prod schema column names and required fields.
      // user_id is required because RLS SELECT policy is auth.uid() = user_id.
      const { data: newAlbum, error: albumError } = await supabase
        .from("albums")
        .insert({
          artist_id: artistDbId,
          artist: artistName, // legacy NOT NULL column
          artist_contacts: artistContactTag ? [artistContactTag] : [],
          title: album.name,
          release_date: normalizeReleaseDate(album.release_date, album.release_date_precision),
          artwork_url: album.images?.[0]?.url || "",
          format: mapAlbumFormat(album.album_type, album.total_tracks),
          status: "Released",
          spotify_id: album.id,
          spotify_url: album.external_urls?.spotify || null,
          total_tracks: album.total_tracks,
          genres_array: artist.genres || [],
          user_id: user.id,
        })
        .select("id")
        .single();

      if (albumError || !newAlbum) {
        console.error("Album insert failed:", album.name, albumError);
        failedAlbums.push({
          title: album.name,
          reason: albumError?.message || "unknown insert error",
        });
        continue;
      }

      const trackIds: string[] = [];

      for (const track of albumTracks) {
        try {
          const isrc = track.external_ids?.isrc || null;
          let trackId: string | null = null;

          // Reuse existing track by ISRC or by spotify_id
          if (isrc) {
            const { data: existingByIsrc } = await supabase
              .from("tracks")
              .select("id")
              .eq("isrc", isrc)
              .maybeSingle();
            if (existingByIsrc) trackId = existingByIsrc.id;
          }

          if (!trackId) {
            const { data: existingBySpotify } = await supabase
              .from("tracks")
              .select("id")
              .eq("spotify_id", track.id)
              .maybeSingle();
            if (existingBySpotify) trackId = existingBySpotify.id;
          }

          if (!trackId) {
            const durationSeconds = Math.floor((track.duration_ms || 0) / 1000);
            const { data: newTrack, error: trackError } = await supabase
              .from("tracks")
              .insert({
                title: track.name,
                duration: String(durationSeconds), // column is text in prod
                track_number: track.track_number,
                disc_number: track.disc_number,
                isrc: isrc || null,
                spotify_id: track.id,
                spotify_url: track.external_urls?.spotify || null,
                preview_url: track.preview_url || null,
                explicit: track.explicit,
                user_id: user.id,
              })
              .select("id")
              .single();

            if (trackError || !newTrack) {
              console.error("Track insert failed:", track.name, trackError);
              continue;
            }
            trackId = newTrack.id;
          }

          // Link track to album (junction). The real unique constraint is
          // (album_id, track_id, disc_number, track_number) so upsert's conflict
          // target is awkward to match — since the album was just created fresh
          // in this loop iteration, a plain insert is always correct.
          const { error: linkError } = await supabase
            .from("album_tracks")
            .insert({
              album_id: newAlbum.id,
              track_id: trackId,
              track_number: track.track_number,
              disc_number: track.disc_number ?? 1,
            });

          if (linkError) {
            console.error("album_tracks link failed:", linkError);
            continue;
          }

          trackIds.push(trackId);
        } catch (trackErr) {
          console.error("Error processing track:", track.name, trackErr);
          continue;
        }
      }

      importedAlbums.push({ title: album.name, tracks: trackIds.length });
    }

    return new Response(
      JSON.stringify({
        success: failedAlbums.length === 0,
        artist: artistName,
        imported: importedAlbums.length,
        skipped: skippedAlbums.length,
        failed: failedAlbums.length,
        details: { importedAlbums, skippedAlbums, failedAlbums },
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

function extractSpotifyArtistId(url: string): string | null {
  const match = url.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
