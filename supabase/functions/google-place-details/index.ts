import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-google-api-key",
};

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_phone_number?: string;
  website?: string;
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
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'place_id is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || req.headers.get('x-google-api-key');
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

    // Call Google Place Details API
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('fields', 'place_id,name,formatted_address,address_components,geometry,formatted_phone_number,website,types');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Place Details API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch place details', details: errorText }),
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

    if (data.status !== 'OK') {
      console.error('Google Place Details API returned error status:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Google Place Details API error', 
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

    const result: PlaceDetailsResult = data.result;

    // Parse address components
    const getAddressComponent = (types: string[]): string => {
      const component = result.address_components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.long_name || '';
    };

    const streetNumber = getAddressComponent(['street_number']);
    const route = getAddressComponent(['route']);
    const address = streetNumber && route ? `${streetNumber} ${route}` : route || result.formatted_address.split(',')[0];
    const city = getAddressComponent(['locality', 'postal_town']);
    const state = getAddressComponent(['administrative_area_level_1']);
    const country = getAddressComponent(['country']);
    const postalCode = getAddressComponent(['postal_code']);

    // Format the result for easier frontend consumption
    const placeDetails = {
      placeId: result.place_id,
      name: result.name,
      address: address,
      city: city,
      state: state,
      country: country,
      postalCode: postalCode,
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      phone: result.formatted_phone_number || '',
      website: result.website || '',
      types: result.types,
    };

    return new Response(
      JSON.stringify({ placeDetails }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      }
    );
  } catch (error) {
    console.error('Error in google-place-details function:', error);
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