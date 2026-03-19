# Calendar Integration Setup Guide

This guide will help you set up Google Calendar and iCal integrations for The Manager platform.

## Features

- **Google Calendar**: OAuth 2.0 integration for reading calendar events
- **iCal/Webcal**: Subscribe to any iCal feed URL (Apple Calendar, Google Calendar public feeds, etc.)
- **Outlook Calendar**: Coming soon
- **Two-way sync**: Optionally sync events back to external calendars
- **Event filtering**: Filter synced events by source
- **Automatic sync**: Background syncing with configurable intervals

## Google Calendar Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the consent screen if prompted
4. Select "Web application" as the application type
5. Add authorized redirect URIs:
   - Development: `http://localhost:5173/calendar`
   - **Production: YOUR ACTUAL DEPLOYMENT URL + `/calendar`** (e.g., `https://yourdomain.com/calendar` or `https://yourdomain.vercel.app/calendar`)

   **CRITICAL:** The application automatically uses `window.location.origin + '/calendar'` as the redirect URI, so you MUST add your production URL to Google Cloud Console's authorized redirect URIs list before it will work.

6. Copy the Client ID and Client Secret

### 3. Configure Environment Variables

Add to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 4. Backend OAuth Flow (Required)

Google OAuth requires a backend to securely exchange the authorization code for tokens. You'll need to create a Supabase Edge Function or similar backend endpoint:

```typescript
// supabase/functions/google-oauth-callback/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI')!,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    return new Response(
      JSON.stringify(tokens),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## iCal/Webcal Setup

No special setup required! Users can add any iCal feed URL directly through the UI.

### Supported iCal Sources

- **Apple iCloud Calendar**: Share calendar and copy the webcal URL
- **Google Calendar**: Make calendar public and use the iCal URL
- **Microsoft Outlook**: Export calendar as .ics and host it
- **Any .ics file URL**: Direct URL to a hosted .ics file

### Finding iCal URLs

**Apple Calendar:**
1. Right-click calendar in Calendar app
2. Select "Share Calendar"
3. Make public and copy the webcal URL

**Google Calendar:**
1. Go to calendar settings
2. Under "Integrate calendar", find "Public URL to this calendar"
3. Use the iCal format URL

## Database Schema

The integration uses two main tables:

### `calendar_connections`
Stores connected calendar accounts with OAuth tokens and sync configuration.

### `synced_events`
Stores all events imported from external calendars.

Both tables have Row Level Security (RLS) enabled, ensuring users can only access their own connections and events.

## Usage

### Connect a Calendar

1. Navigate to the Calendar page
2. Click "Manage Calendars"
3. Click "Add Calendar"
4. Choose your provider (Google or iCal)
5. Follow the authentication flow

### Sync Events

Events are automatically synced when you:
- First connect a calendar
- Click the "Sync Now" button
- On a scheduled interval (if configured)

### Manage Connections

From the "Manage Calendars" modal, you can:
- Enable/disable sync for each connection
- Toggle notifications
- Manually trigger sync
- Disconnect calendars
- View sync errors and last sync time

## Security Considerations

1. **OAuth Tokens**: Access and refresh tokens should be encrypted at rest
2. **Backend Requirement**: OAuth flows must go through a backend to protect client secrets
3. **RLS Policies**: Database has strict Row Level Security policies
4. **HTTPS Only**: All OAuth redirects must use HTTPS in production
5. **Token Refresh**: Implement automatic token refresh for expired access tokens

## Troubleshooting

### Google OAuth Errors

**Error: "redirect_uri_mismatch" or ERR_CONNECTION_REFUSED**
- The application now uses dynamic redirect URIs based on your current domain
- You MUST add your production URL to Google Cloud Console's authorized redirect URIs
- Format: `https://yourdomain.com/calendar` (no trailing slash)
- Include the protocol (http:// or https://)
- Make sure you've added BOTH localhost AND your production URL

**Error: "invalid_grant"**
- The authorization code may have expired (codes expire after 10 minutes)
- Make sure you're not reusing an authorization code
- Check that your system clock is accurate

### iCal Feed Errors

**Error: "Failed to fetch"**
- The iCal URL must be publicly accessible
- CORS may be blocking the request - use a backend proxy if needed
- Ensure the URL returns valid iCal format data

**No events showing up**
- Check that the feed contains events in the date range you're viewing
- Verify the iCal format is valid (use an iCal validator)
- Check the sync error message in the connection details

## Advanced Configuration

### Custom Sync Intervals

To implement automatic background syncing, use a cron job or scheduled task:

```typescript
// Run every 15 minutes
setInterval(async () => {
  await calendarIntegrationService.syncAllConnections();
}, 15 * 60 * 1000);
```

### Event Filtering

Filter synced events by:
- Date range
- Calendar source
- Event type
- Keywords

### Two-Way Sync

Enable two-way sync to allow:
- Creating events in THE MANAGER that sync to external calendars
- Updating events that sync back
- Deleting events that remove from external calendars

Note: Two-way sync requires write permissions in OAuth scopes.

## Support

For issues or questions about calendar integrations:
1. Check the sync error messages in the UI
2. Review browser console for detailed error logs
3. Verify your OAuth credentials are correct
4. Ensure backend endpoints are properly configured

## Future Enhancements

- [ ] Microsoft Outlook/Office 365 integration
- [ ] CalDAV support
- [ ] Event creation and editing
- [ ] Real-time webhooks for instant sync
- [ ] Conflict resolution for overlapping events
- [ ] Calendar color customization
- [ ] Event categories and tags
