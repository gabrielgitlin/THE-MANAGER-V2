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
  isrc?: string;
  external_urls: { spotify: string };
  preview_url?: string;
  explicit: boolean;
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

    const artistId = extractSpotifyArtistId(spotifyArtistUrl);
    if (!artistId) {
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

    const artistResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      }
    );

    if (!artistResponse.ok) {
      throw new Error("Failed to fetch artist from Spotify");
    }

    const artist = await artistResponse.json();

    const { data: existingArtist, error: artistCheckError } = await supabase
      .from("artists")
      .select("id")
      .eq("spotify_id", artistId)
      .maybeSingle();

    let artistDbId: string;

    if (existingArtist) {
      artistDbId = existingArtist.id;
    } else {
      const { data: newArtist, error: artistError } = await supabase
        .from("artists")
        .insert({
          name: artist.name,
          spotify_id: artistId,
          spotify_url: artist.external_urls.spotify,
          image_url: artist.images[0]?.url || '',
          genre: artist.genres?.[0] || '',
          spotify_followers: artist.followers?.total || 0,
          spotify_popularity: artist.popularity || 0,
        })
        .select()
        .single();

      if (artistError) throw artistError;
      artistDbId = newArtist.id;
    }

    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,ep,compilation,appears_on&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      }
    );

    if (!albumsResponse.ok) {
      throw new Error("Failed to fetch albums from Spotify");
    }

    const albumsData = await albumsResponse.json();
    const albums: SpotifyAlbum[] = albumsData.items;

    const importedAlbums: { title: string; tracks: number }[] = [];
    const skippedAlbums: { title: string; reason: string }[] = [];

    for (const album of albums) {
      const { data: existingAlbum } = await supabase
        .from("albums")
        .select("id")
        .eq("spotify_id", album.id)
        .maybeSingle();

      if (existingAlbum) {
        skippedAlbums.push({
          title: album.name,
          reason: "Already imported",
        });
        continue;
      }

      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        }
      );

      if (!tracksResponse.ok) continue;

      const tracksData = await tracksResponse.json();
      const albumTracks: SpotifyTrack[] = tracksData.items;

      const { data: newAlbum, error: albumError } = await supabase
        .from("albums")
        .insert({
          artist_id: artistDbId,
          title: album.name,
          release_date: album.release_date,
          cover_url: album.images[0]?.url || '',
          format: album.album_type === 'album' ? 'Album' : album.album_type === 'single' ? 'Single' : 'EP',
          status: 'Released',
          spotify_id: album.id,
          spotify_url: album.external_urls.spotify,
          total_tracks: album.total_tracks,
          genres_array: artist.genres || [],
        })
        .select()
        .single();

      if (albumError) throw albumError;

      const trackIds: string[] = [];

      for (const track of albumTracks) {
        let trackId: string;

        if (track.isrc && track.isrc !== '') {
          const { data: existingTrack } = await supabase
            .from('tracks')
            .select('id')
            .eq('isrc', track.isrc)
            .maybeSingle();

          if (existingTrack) {
            trackId = existingTrack.id;
          } else {
            const { data: newTrack, error: trackError } = await supabase
              .from('tracks')
              .insert({
                title: track.name,
                duration: Math.floor(track.duration_ms / 1000),
                track_number: track.track_number,
                disc_number: track.disc_number,
                isrc: track.isrc,
                spotify_id: track.id,
                spotify_url: track.external_urls.spotify,
                preview_url: track.preview_url || '',
                explicit: track.explicit,
              })
              .select('id')
              .single();

            if (trackError) throw trackError;
            trackId = newTrack.id;

            const { error: creditError } = await supabase
              .from('credits')
              .insert({
                entity_id: trackId,
                entity_type: 'track',
                name: artist.name,
                role: 'artist',
                master_percentage: 100,
                publishing_percentage: 100,
              });

            if (creditError) throw creditError;
          }
        } else {
          const { data: newTrack, error: trackError } = await supabase
            .from('tracks')
            .insert({
              title: track.name,
              duration: Math.floor(track.duration_ms / 1000),
              track_number: track.track_number,
              disc_number: track.disc_number,
              isrc: track.isrc || '',
              spotify_id: track.id,
              spotify_url: track.external_urls.spotify,
              preview_url: track.preview_url || '',
              explicit: track.explicit,
            })
            .select('id')
            .single();

          if (trackError) throw trackError;
          trackId = newTrack.id;

          const { error: creditError } = await supabase
            .from('credits')
            .insert({
              entity_id: trackId,
              entity_type: 'track',
              name: artist.name,
              role: 'artist',
              master_percentage: 100,
              publishing_percentage: 100,
            });

          if (creditError) throw creditError;
        }

        const { error: albumTrackError } = await supabase
          .from('album_tracks')
          .insert({
            album_id: newAlbum.id,
            track_id: trackId,
            track_number: track.track_number,
            disc_number: track.disc_number,
          });

        if (albumTrackError) throw albumTrackError;
        trackIds.push(trackId);
      }

      importedAlbums.push({
        title: album.name,
        tracks: trackIds.length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        artist: artist.name,
        imported: importedAlbums.length,
        skipped: skippedAlbums.length,
        details: { importedAlbums, skippedAlbums },
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

function extractSpotifyArtistId(url: string): string | null {
  const match = url.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}