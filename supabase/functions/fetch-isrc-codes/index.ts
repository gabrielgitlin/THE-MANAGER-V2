import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── MusicBrainz rate limiter (1 req / sec) ────────────────────────────────────

let _lastMbRequest = 0;
const MB_BASE = "https://musicbrainz.org/ws/2";
const MB_HEADERS = { "User-Agent": "TheManager/1.0", "Accept": "application/json" };

async function mbFetch(path: string): Promise<any | null> {
  const now = Date.now();
  const wait = 1100 - (now - _lastMbRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _lastMbRequest = Date.now();
  try {
    const res = await fetch(`${MB_BASE}${path}`, { headers: MB_HEADERS });
    if (res.status === 503 || res.status === 429) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Returns the first ISRC found for the given recording title + artist.
async function mbSearchISRC(title: string, artist: string): Promise<string | null> {
  for (const q of [
    `recording:"${title}" AND artist:"${artist}"`,
    `recording:${title} AND artist:${artist}`,
  ]) {
    const data = await mbFetch(`/recording?query=${encodeURIComponent(q)}&fmt=json&limit=5`);
    const recordings: any[] = data?.recordings || [];
    for (const rec of recordings) {
      if (rec.isrcs?.length) return rec.isrcs[0];
    }
    if (recordings[0]?.id) {
      const detail = await mbFetch(`/recording/${recordings[0].id}?inc=isrcs&fmt=json`);
      if (detail?.isrcs?.length) return detail.isrcs[0];
    }
    if (recordings.length > 0) break;
  }
  return null;
}

// Returns credits (songwriter, producer, engineer) for a recording by ISRC.
// Requires 2 MusicBrainz requests: search + detail with inc=artist-rels.
async function mbCreditsForISRC(isrc: string): Promise<{ name: string; role: string }[]> {
  const searchData = await mbFetch(`/recording?query=isrc:${encodeURIComponent(isrc)}&fmt=json&limit=1`);
  const recordingId = searchData?.recordings?.[0]?.id;
  if (!recordingId) return [];

  const detail = await mbFetch(`/recording/${recordingId}?inc=artist-rels&fmt=json`);
  const relations: any[] = detail?.relations || [];

  const ROLE_MAP: Record<string, string> = {
    'composer': 'songwriter',
    'lyricist': 'songwriter',
    'writer': 'songwriter',
    'producer': 'producer',
    'engineer': 'engineer',
    'mix': 'engineer',
    'mastering': 'engineer',
    'recording': 'engineer',
  };

  const credits: { name: string; role: string }[] = [];
  for (const rel of relations) {
    const role = ROLE_MAP[rel.type?.toLowerCase()];
    if (!role) continue;
    const name = rel.artist?.name;
    if (name) credits.push({ name, role });
  }
  return credits;
}

// ── ISRCFinder.com scraper ────────────────────────────────────────────────────

const ISRC_REGEX = /\b([A-Z]{2}[A-Z0-9]{3}\d{7})\b/;

async function isrcFinderSearch(title: string, artist: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await fetch(`https://www.isrcfinder.com/search?q=${q}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(ISRC_REGEX);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ── Spotify helpers ───────────────────────────────────────────────────────────

async function getSpotifyToken(): Promise<string | null> {
  const id = Deno.env.get("SPOTIFY_CLIENT_ID");
  const secret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!id || !secret) return null;
  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Authorization": `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    return (await res.json()).access_token || null;
  } catch { return null; }
}

async function spFetch(path: string, token: string): Promise<any | null> {
  try {
    const res = await fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

// Returns ISRC + additional track metadata from a Spotify track lookup.
async function spTrackData(spotifyId: string, token: string): Promise<{
  isrc: string | null; popularity: number | null; explicit: boolean | null; previewUrl: string | null;
}> {
  const data = await spFetch(`/tracks/${spotifyId}`, token);
  if (!data) return { isrc: null, popularity: null, explicit: null, previewUrl: null };
  return {
    isrc: data.external_ids?.isrc || null,
    popularity: data.popularity ?? null,
    explicit: data.explicit ?? null,
    previewUrl: data.preview_url || null,
  };
}

// Returns ISRC + additional track metadata from a Spotify search.
async function spSearchTrack(title: string, artist: string, token: string): Promise<{
  isrc: string | null; trackId: string | null; albumId: string | null;
  popularity: number | null; explicit: boolean | null; previewUrl: string | null;
}> {
  const data = await spFetch(`/search?q=${encodeURIComponent(`track:${title} artist:${artist}`)}&type=track&limit=1`, token);
  const t = data?.tracks?.items?.[0];
  if (!t) return { isrc: null, trackId: null, albumId: null, popularity: null, explicit: null, previewUrl: null };
  return {
    isrc: t.external_ids?.isrc || null,
    trackId: t.id || null,
    albumId: t.album?.id || null,
    popularity: t.popularity ?? null,
    explicit: t.explicit ?? null,
    previewUrl: t.preview_url || null,
  };
}

// Returns UPC, label, and genres from a Spotify album.
async function spAlbumData(albumSpotifyId: string, token: string): Promise<{
  upc: string | null; label: string | null; genres: string[] | null;
}> {
  const data = await spFetch(`/albums/${albumSpotifyId}`, token);
  if (!data) return { upc: null, label: null, genres: null };
  return {
    upc: data.external_ids?.upc || null,
    label: data.label || null,
    genres: data.genres?.length ? data.genres : null,
  };
}

// Returns barcode, label, and distributor from MusicBrainz for a given release.
async function mbSearchRelease(albumTitle: string, artist: string): Promise<{
  upc: string | null; label: string | null; distributor: string | null;
}> {
  const q = `release:"${albumTitle}" AND artist:"${artist}"`;
  const data = await mbFetch(`/release?query=${encodeURIComponent(q)}&fmt=json&limit=5&inc=labels`);
  for (const release of (data?.releases || [])) {
    const upc = release.barcode || null;
    let label: string | null = null;
    let distributor: string | null = null;
    for (const li of (release['label-info'] || [])) {
      const lbl = li.label;
      if (!lbl) continue;
      const type = (lbl.type || '').toLowerCase();
      if (type === 'distributor' || type === 'rights society') {
        if (!distributor) distributor = lbl.name;
      } else {
        if (!label) label = lbl.name;
      }
    }
    if (upc || label || distributor) return { upc, label, distributor };
  }
  return { upc: null, label: null, distributor: null };
}

// Module-level cache: album DB id → Spotify album id, populated during phase 1
const _albumSpotifyCache = new Map<string, string>();

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Unauthorized");

    const spotifyToken = await getSpotifyToken();

    const isrcUpdated: { title: string; isrc: string; source: string }[] = [];
    const isrcFailed:  { title: string; reason: string }[] = [];
    const upcUpdated:  { albumId: string; upc: string }[] = [];
    const creditsAdded: { title: string; count: number }[] = [];

    // ════ PHASE 1: ISRC + track metadata for tracks missing it ════════════════

    const { data: tracks, error: tracksErr } = await supabase
      .from('tracks')
      .select(`
        id, title, spotify_id, isrc,
        album_tracks!inner (
          albums!inner (
            id, spotify_id,
            artists ( name )
          )
        )
      `)
      .or('isrc.is.null,isrc.eq.');

    if (tracksErr) throw tracksErr;

    for (const track of tracks || []) {
      try {
        let isrc: string | null = null;
        let source = '';
        const trackUpdates: Record<string, any> = {};
        const artist = track.album_tracks?.[0]?.albums?.artists?.name || '';
        const albumDbId = track.album_tracks?.[0]?.albums?.id;
        const albumSpotifyId = track.album_tracks?.[0]?.albums?.spotify_id;

        // 1a. Spotify direct
        if (spotifyToken && track.spotify_id) {
          const sp = await spTrackData(track.spotify_id, spotifyToken);
          isrc = sp.isrc;
          if (isrc) source = 'Spotify';
          if (sp.popularity !== null) trackUpdates.popularity = sp.popularity;
          if (sp.explicit !== null) trackUpdates.explicit = sp.explicit;
          if (sp.previewUrl) trackUpdates.preview_url = sp.previewUrl;
        }

        // 1b. Spotify search
        if (!isrc && spotifyToken && artist) {
          const sp = await spSearchTrack(track.title, artist, spotifyToken);
          isrc = sp.isrc; if (isrc) source = 'Spotify';
          if (sp.popularity !== null) trackUpdates.popularity = sp.popularity;
          if (sp.explicit !== null) trackUpdates.explicit = sp.explicit;
          if (sp.previewUrl) trackUpdates.preview_url = sp.previewUrl;
          if (!track.spotify_id && sp.trackId)
            trackUpdates.spotify_id = sp.trackId;
          const resolvedAlbumSpotify = albumSpotifyId || sp.albumId;
          if (resolvedAlbumSpotify && albumDbId)
            _albumSpotifyCache.set(albumDbId, resolvedAlbumSpotify);
        }

        // 1c. MusicBrainz fallback
        if (!isrc && artist) {
          isrc = await mbSearchISRC(track.title, artist);
          if (isrc) source = 'MusicBrainz';
        }

        // 1d. ISRCFinder.com fallback
        if (!isrc && artist) {
          isrc = await isrcFinderSearch(track.title, artist);
          if (isrc) source = 'ISRCFinder';
        }

        if (isrc) trackUpdates.isrc = isrc;

        if (Object.keys(trackUpdates).length > 0) {
          await supabase.from('tracks').update(trackUpdates).eq('id', track.id);
        }

        if (isrc) {
          isrcUpdated.push({ title: track.title, isrc, source });
        } else {
          isrcFailed.push({ title: track.title, reason: 'Not found on Spotify or MusicBrainz' });
        }
      } catch (e: any) {
        isrcFailed.push({ title: track.title, reason: e.message });
      }
    }

    // ════ PHASE 2: Credits for tracks with ISRC but no existing credits ═══════
    // Limited to 5 tracks per run (each needs 2 MusicBrainz requests).

    const { data: tracksForCredits } = await supabase
      .from('tracks')
      .select('id, title, isrc')
      .not('isrc', 'is', null)
      .neq('isrc', '');

    for (const track of tracksForCredits || []) {
      const { data: existing } = await supabase
        .from('credits')
        .select('id')
        .eq('entity_id', track.id)
        .eq('entity_type', 'track')
        .limit(1);

      if (existing?.length) continue;

      const mbCredits = await mbCreditsForISRC(track.isrc!);
      if (mbCredits.length === 0) continue;

      const rows = mbCredits.map(c => ({
        entity_id: track.id,
        entity_type: 'track',
        name: c.name,
        role: c.role,
        user_id: user.id,
      }));

      await supabase.from('credits').insert(rows);
      creditsAdded.push({ title: track.title, count: mbCredits.length });
    }

    // ════ PHASE 3: UPC + label + genres + distributor for albums ══════════════

    const { data: albums, error: albumsErr } = await supabase
      .from('albums')
      .select(`id, title, spotify_id, upc, label, distributor, genres, artists ( name )`);

    if (albumsErr) throw albumsErr;

    for (const album of albums || []) {
      try {
        const artist = (album as any).artists?.name || '';

        let upc: string | null = (album as any).upc || null;
        let label: string | null = (album as any).label || null;
        let distributor: string | null = (album as any).distributor || null;
        let genres: string[] | null = ((album as any).genres as string[])?.length ? (album as any).genres : null;
        const updates: Record<string, any> = {};

        // 3a. Spotify album data (UPC, label, genres) — no artist name required
        const albumSpotify = (album as any).spotify_id || _albumSpotifyCache.get(album.id) || null;
        if (spotifyToken && albumSpotify) {
          const spData = await spAlbumData(albumSpotify, spotifyToken);
          if (!upc && spData.upc)       { upc    = spData.upc;    updates.upc    = upc; }
          if (!label && spData.label)   { label  = spData.label;  updates.label  = label; }
          if (!genres && spData.genres) { genres = spData.genres; updates.genres = genres; }
        }

        // 3b. MusicBrainz label + barcode + distributor (requires artist name)
        if ((!upc || !label || !distributor) && artist) {
          const mbData = await mbSearchRelease(album.title, artist);
          if (!upc && mbData.upc)                   { upc         = mbData.upc;         updates.upc         = upc; }
          if (!label && mbData.label)               { label       = mbData.label;       updates.label       = label; }
          if (!distributor && mbData.distributor)   { distributor = mbData.distributor; updates.distributor = distributor; }
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('albums').update(updates).eq('id', album.id);
          if (updates.upc) upcUpdated.push({ albumId: album.id, upc: updates.upc });
        }
      } catch { /* continue to next album */ }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: isrcUpdated.length,
        failed: isrcFailed.length,
        upcsUpdated: upcUpdated.length,
        creditsAdded: creditsAdded.reduce((sum, c) => sum + c.count, 0),
        usingSpotify: !!spotifyToken,
        details: {
          updated: isrcUpdated,
          failed: isrcFailed,
          albumsUpdated: upcUpdated,
          credits: creditsAdded,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
