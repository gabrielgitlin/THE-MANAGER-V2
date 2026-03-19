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
      .eq('platform', 'bandsintown')
      .eq('enabled', true)
      .maybeSingle();

    if (!integration || !integration.api_key) {
      return new Response(
        JSON.stringify({ error: 'Bandsintown integration not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Format show data for Bandsintown API
    const bandsintownEvent = {
      datetime: `${showData.date}T${showData.show_time || '20:00:00'}`,
      venue: {
        name: showData.venue_name,
        city: showData.venue_city,
        region: showData.venue_state || '',
        country: showData.venue_country,
        latitude: showData.venue_latitude || null,
        longitude: showData.venue_longitude || null,
      },
      on_sale_datetime: new Date().toISOString(),
    };

    // Sync to Bandsintown
    const bandsintownResponse = await fetch(
      `https://rest.bandsintown.com/v4/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.api_key}`,
        },
        body: JSON.stringify(bandsintownEvent),
      }
    );

    if (!bandsintownResponse.ok) {
      const errorText = await bandsintownResponse.text();
      throw new Error(`Bandsintown API error: ${errorText}`);
    }

    const result = await bandsintownResponse.json();

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
    console.error('Error syncing to Bandsintown:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});