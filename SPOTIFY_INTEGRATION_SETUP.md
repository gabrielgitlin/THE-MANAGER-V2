# Spotify Integration Setup Guide

This guide will help you set up Spotify catalog import functionality in THE MANAGER.

## Prerequisites

- A Spotify account
- A Supabase project (already configured)

## Step 1: Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the required information:
   - **App Name**: "The Manager - Catalog Import"
   - **App Description**: "Import artist catalog into The Manager platform"
   - **Redirect URI**: Not required for this integration
   - **APIs Used**: Select "Web API"
5. Accept the Terms of Service and click **"Save"**

## Step 2: Get Your Credentials

1. In your new app's dashboard, click on **"Settings"**
2. You'll see two important values:
   - **Client ID**: Copy this value
   - **Client Secret**: Click "View client secret" and copy this value

## Step 3: Configure Supabase Edge Function

The Spotify credentials need to be added as secrets to your Supabase edge function.

### Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
supabase secrets set SPOTIFY_CLIENT_ID=your_client_id_here
supabase secrets set SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### Using Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on the **"import-spotify-catalog"** function
5. Go to the **"Settings"** tab
6. Add the following secrets:
   - Key: `SPOTIFY_CLIENT_ID`, Value: (paste your Client ID)
   - Key: `SPOTIFY_CLIENT_SECRET`, Value: (paste your Client Secret)

## Step 4: Test the Integration

1. Log in to THE MANAGER
2. Navigate to the **Catalog** page
3. Click the **"Import from Spotify"** button (green button next to "Add New")
4. Paste a Spotify artist URL (e.g., `https://open.spotify.com/artist/36QJpDe2go2KgaRleHCDTp`)
5. Click **"Import Catalog"**

The system will:
- Fetch all albums, EPs, and singles from the artist
- Import all tracks with metadata (title, duration, ISRC, etc.)
- Skip any albums that already exist (based on Spotify ID)
- Display a summary of imported and skipped items

## Features

### Automatic Deduplication

The import system automatically detects duplicate albums using Spotify IDs. If an album has already been imported, it will be skipped to prevent duplicates.

### Imported Metadata

For each album:
- Title
- Release date
- Cover artwork URL
- Format (Album, EP, or Single)
- Total tracks
- Genres

For each track:
- Title
- Track number
- Disc number
- Duration
- ISRC code
- Spotify URL
- 30-second preview URL
- Explicit content flag

### Artist Profile Updates

When importing, the system also updates the artist profile with:
- Spotify ID
- Spotify URL
- Number of followers
- Popularity score
- Profile image

## Troubleshooting

### "Failed to get Spotify access token"

This means your Spotify credentials are not configured correctly. Double-check that:
1. Both `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set in Supabase secrets
2. The credentials are from the correct Spotify app
3. There are no extra spaces or quotes in the values

### "Invalid Spotify artist URL"

Make sure you're pasting a valid Spotify artist URL. The URL should look like:
`https://open.spotify.com/artist/[ARTIST_ID]`

You can find this by:
1. Opening Spotify
2. Searching for the artist
3. Clicking the three dots menu
4. Selecting "Share" → "Copy link to artist"

### Rate Limiting

Spotify API has rate limits. If you're importing many albums, the process might take some time. The edge function handles pagination automatically, but very large catalogs (100+ albums) might take a minute or two to complete.

## Security Notes

- Your Spotify credentials are stored securely as Supabase edge function secrets
- They are never exposed to the client-side application
- The Client Credentials flow is used, which doesn't require user authentication
- This only accesses public catalog data - no private user information is accessed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Spotify credentials are correctly configured
3. Ensure the Supabase edge function is deployed and running
4. Check that the artist URL is valid and the artist exists on Spotify
