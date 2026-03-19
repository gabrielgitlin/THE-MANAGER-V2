import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PlaceAutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');

    if (!input || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Search input is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call Google Places Autocomplete API
    // Restrict to establishment types that are venues
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('types', 'establishment');
    // Optionally add location bias if needed
    // url.searchParams.append('location', '40.7128,-74.0060'); // Example: NYC
    // url.searchParams.append('radius', '50000'); // 50km radius

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch places', details: errorText }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API returned error status:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Google Places API error', 
          status: data.status,
          message: data.error_message 
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Format the results for easier frontend consumption
    const predictions = data.predictions?.map((prediction: PlaceAutocompleteResult) => ({
      placeId: prediction.place_id,
      name: prediction.structured_formatting.main_text,
      address: prediction.structured_formatting.secondary_text,
      fullDescription: prediction.description,
      types: prediction.types,
    })) || [];

    return new Response(
      JSON.stringify({ predictions }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('Error in google-places-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});