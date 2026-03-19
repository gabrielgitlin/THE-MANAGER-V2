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

interface Track {
  id: string;
  title: string;
  spotify_id?: string;
  isrc?: string;
  artist_name?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
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

    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        spotify_id,
        isrc,
        album_tracks!inner (
          album_id,
          albums!inner (
            id,
            spotify_id,
            upc,
            artists (
              name
            )
          )
        )
      `)
      .or('isrc.is.null,isrc.eq.')
      .limit(100);

    if (tracksError) throw tracksError;

    const updated: { title: string; isrc: string }[] = [];
    const failed: { title: string; reason: string }[] = [];
    const albumsUpdated: { albumId: string; upc: string }[] = [];
    const processedAlbums = new Set<string>();

    for (const track of tracksData || []) {
      try {
        let isrc: string | null = null;
        const artistName = track.album_tracks?.[0]?.albums?.artists?.name || '';
        const albumId = track.album_tracks?.[0]?.albums?.id;
        const albumSpotifyId = track.album_tracks?.[0]?.albums?.spotify_id;
        const albumUpc = track.album_tracks?.[0]?.albums?.upc;

        if (track.spotify_id) {
          const trackResponse = await fetch(
            `https://api.spotify.com/v1/tracks/${track.spotify_id}`,
            {
              headers: {
                Authorization: `Bearer ${spotifyAccessToken}`,
              },
            }
          );

          if (trackResponse.ok) {
            const trackData = await trackResponse.json();
            isrc = trackData.external_ids?.isrc || null;

            if (albumId && !albumUpc && !processedAlbums.has(albumId) && trackData.album?.id) {
              const albumResponse = await fetch(
                `https://api.spotify.com/v1/albums/${trackData.album.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${spotifyAccessToken}`,
                  },
                }
              );

              if (albumResponse.ok) {
                const albumData = await albumResponse.json();
                const upc = albumData.external_ids?.upc || null;

                if (upc) {
                  await supabase
                    .from('albums')
                    .update({ upc })
                    .eq('id', albumId);

                  albumsUpdated.push({ albumId, upc });
                  processedAlbums.add(albumId);
                }
              }
            }
          }
        }

        if (!isrc && artistName) {
          const searchQuery = encodeURIComponent(`track:${track.title} artist:${artistName}`);
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
            {
              headers: {
                Authorization: `Bearer ${spotifyAccessToken}`,
              },
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const firstTrack = searchData.tracks?.items?.[0];
            if (firstTrack) {
              isrc = firstTrack.external_ids?.isrc || null;

              if (!track.spotify_id && firstTrack.id) {
                await supabase
                  .from('tracks')
                  .update({
                    spotify_id: firstTrack.id,
                    spotify_url: firstTrack.external_urls?.spotify,
                    preview_url: firstTrack.preview_url,
                  })
                  .eq('id', track.id);
              }

              if (albumId && !albumUpc && !processedAlbums.has(albumId) && firstTrack.album?.id) {
                const albumResponse = await fetch(
                  `https://api.spotify.com/v1/albums/${firstTrack.album.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${spotifyAccessToken}`,
                    },
                  }
                );

                if (albumResponse.ok) {
                  const albumData = await albumResponse.json();
                  const upc = albumData.external_ids?.upc || null;

                  if (upc) {
                    await supabase
                      .from('albums')
                      .update({ upc })
                      .eq('id', albumId);

                    albumsUpdated.push({ albumId, upc });
                    processedAlbums.add(albumId);
                  }
                }
              }
            }
          }
        }

        if (isrc) {
          const { error: updateError } = await supabase
            .from('tracks')
            .update({ isrc })
            .eq('id', track.id);

          if (updateError) throw updateError;

          updated.push({
            title: track.title,
            isrc,
          });
        } else {
          failed.push({
            title: track.title,
            reason: 'ISRC not found',
          });
        }
      } catch (error) {
        failed.push({
          title: track.title,
          reason: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updated.length,
        failed: failed.length,
        upcsUpdated: albumsUpdated.length,
        details: { updated, failed, albumsUpdated },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
