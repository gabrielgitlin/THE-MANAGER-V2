# Google Places API Setup Guide

This guide will help you set up the Google Places API for the venue search feature in The Manager.

## Overview

The venue search feature uses Google Places API to provide autocomplete suggestions and detailed information about venues worldwide. This integration allows users to:

- Search for venues using Google Maps-style autocomplete
- Auto-populate venue details (address, city, state, country, coordinates)
- View venue locations on an interactive map preview
- Automatically save discovered venues to the database

## Prerequisites

- A Google Cloud Platform account
- A valid payment method (Google Places API requires billing to be enabled)

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "The Manager - Venue Search")
5. Click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Places API (New)** - For autocomplete and place details
   - **Maps Static API** - For map preview images
3. Click "Enable" for each API

### 3. Enable Billing

**Important:** Google Places API requires billing to be enabled, even for the free tier.

1. Navigate to "Billing" in the left sidebar
2. Link a billing account or create a new one
3. Add a valid payment method

**Cost Information:**
- Places Autocomplete: $2.83 per 1,000 requests
- Place Details: $17 per 1,000 requests
- Static Maps: $2 per 1,000 requests
- Free tier: $200 credit per month (covers ~70,000 autocomplete requests)

### 4. Create API Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. Click "Restrict Key" (recommended for security)

### 5. Configure API Key Restrictions (Recommended)

#### Application Restrictions:
- Select "HTTP referrers (web sites)"
- Add your domain(s):
  - `https://yourdomain.com/*`
  - `http://localhost:5173/*` (for local development)

#### API Restrictions:
- Select "Restrict key"
- Choose the following APIs:
  - Places API (New)
  - Maps Static API

### 6. Add API Key to Environment Variables

#### For Supabase Edge Functions:

The API key is automatically configured as a secret in Supabase. No manual setup needed.

#### For Frontend (Map Preview):

1. Add to your `.env` file:
   ```
   VITE_GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

2. Restart your development server

## Testing the Integration

### 1. Test Venue Search

1. Navigate to the Live section
2. Click "Add Show"
3. In the venue field, type a venue name (e.g., "Madison Square Garden")
4. You should see autocomplete suggestions with:
   - Star icon for venues in your database
   - Globe icon for Google Places results
   - "Verified" badge for Google-sourced venues

### 2. Test Auto-Population

1. Select a venue from the search results
2. All location fields should auto-populate:
   - Address
   - City
   - State/Province
   - Country
   - Coordinates

### 3. Test Map Preview

1. After selecting a venue, a map preview should appear
2. The map should show the venue's location with a marker
3. Click "Open in Maps" to view in Google Maps

### 4. Verify Auto-Save

1. Select a new venue from Google Places (globe icon)
2. Check your Supabase `venues` table
3. The venue should be automatically saved with `is_verified = true`

## Rate Limiting Recommendations

To minimize API costs:

1. **Debouncing:** Search requests are automatically debounced (300ms delay)
2. **Local Search First:** The system searches your database before querying Google
3. **Caching:** Edge functions cache responses (1 hour for autocomplete, 24 hours for details)
4. **Usage Tracking:** Venues are tracked by `usage_count` for better local results

## Troubleshooting

### "API key not configured" Error

**Frontend:**
- Ensure `VITE_GOOGLE_PLACES_API_KEY` is in your `.env` file
- Restart the development server after adding the key

**Backend:**
- The API key is automatically configured in Supabase
- Check Supabase logs if edge functions fail

### "Map preview unavailable" Message

- Verify the API key is correctly set in `.env`
- Check that Maps Static API is enabled in Google Cloud Console
- Ensure the API key has the correct restrictions

### No Search Results

1. Check browser console for errors
2. Verify internet connection
3. Ensure billing is enabled in Google Cloud
4. Check API key restrictions aren't blocking requests

### Rate Limit Exceeded

- Monitor your usage in Google Cloud Console
- Consider increasing the debounce delay in `venueSearch.ts`
- Review and optimize search patterns

## Cost Optimization Tips

1. **Use Database First:** Always search local venues before Google
2. **Set Capacity Limits:** Pre-fill common venues in your database
3. **Monitor Usage:** Track API calls in Google Cloud Console
4. **Alert Setup:** Set up billing alerts at $50, $100, $150
5. **Request Limits:** Consider implementing daily request limits

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use API key restrictions** to prevent unauthorized use
3. **Rotate keys regularly** (every 90 days recommended)
4. **Monitor for suspicious activity** in Cloud Console
5. **Use separate keys** for development and production

## Support

For issues related to:
- **Google Places API:** [Google Maps Platform Support](https://developers.google.com/maps/support)
- **The Manager App:** Check application logs or contact support

## Additional Resources

- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Maps Static API Documentation](https://developers.google.com/maps/documentation/maps-static)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Best Practices Guide](https://developers.google.com/maps/documentation/places/web-service/best-practices)
