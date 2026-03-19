import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ShowData {
  id: string;
  title: string;
  venue_name: string;
  venue_city: string;
  venue_country: string;
  venue_state?: string;
  date: string;
  show_time?: string;
  venue_latitude?: number;
  venue_longitude?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { showData, artistId } = await req.json();

    // Get integration settings
    const { data: integration } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('artist_id', artistId)
      .eq('platform', 'songkick')
      .eq('enabled', true)
      .maybeSingle();

    if (!integration || !integration.api_key) {
      return new Response(
        JSON.stringify({ error: 'Songkick integration not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Format show data for Songkick API
    const songkickEvent = {
      event: {
        display_name: showData.title,
        start: {
          date: showData.date,
          time: showData.show_time || '20:00:00',
        },
        location: {
          city: showData.venue_city,
          lat: showData.venue_latitude || null,
          lng: showData.venue_longitude || null,
        },
        venue: {
          displayName: showData.venue_name,
        },
        performance: [{
          artist: {
            id: integration.platform_artist_id,
          },
          billing: 'headline',
        }],
      },
    };

    // Sync to Songkick
    const songkickResponse = await fetch(
      `https://api.songkick.com/api/3.0/events.json?apikey=${integration.api_key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songkickEvent),
      }
    );

    if (!songkickResponse.ok) {
      const errorText = await songkickResponse.text();
      throw new Error(`Songkick API error: ${errorText}`);
    }

    const result = await songkickResponse.json();

    // Update last sync time
    await supabase
      .from('platform_integrations')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', integration.id);

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing to Songkick:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});