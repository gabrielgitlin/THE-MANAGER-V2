# YouTube Analytics Integration Setup

This guide will help you set up YouTube Analytics integration for The Manager platform.

## Prerequisites

- Google Cloud Console account
- YouTube channel
- Admin access to Google Cloud project

## Step 1: Google Cloud Console Configuration

### 1.1 Access Your Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the project with Client ID: `1018807402846-5fojit5gfd7pnqrl8js1qgno061qiii5`)

### 1.2 Enable YouTube APIs

1. Go to **APIs & Services** > **Library**
2. Search for and enable:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
   - **YouTube Reporting API** (optional, but recommended)

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Ensure the following scopes are added:
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
3. Save changes

### 1.4 Add Authorized Redirect URIs

1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:

   **For Local Development:**
   ```
   http://localhost:5173/settings
   http://localhost:5174/settings
   http://localhost:3000/settings
   ```

   **For Production:**
   ```
   https://yourdomain.com/settings
   https://www.yourdomain.com/settings
   ```

4. Click **Save**

## Step 2: Application Configuration

The application is already configured with the necessary OAuth credentials. No code changes are needed if you're using the existing Google Client ID.

### Current Configuration

- **Client ID**: `1018807402846-5fojit5gfd7pnqrl8js1qgno061qiii5.apps.googleusercontent.com`
- **Client Secret**: Stored in edge functions
- **Scopes**:
  - `youtube.readonly`
  - `yt-analytics.readonly`

## Step 3: Testing the Integration

### 3.1 Connect YouTube Account

1. Start your development server: `npm run dev`
2. Navigate to **Settings** > **Analytics** tab
3. Click **Connect** on the YouTube card
4. You'll be redirected to Google's OAuth consent screen
5. Select your YouTube/Google account
6. Grant the requested permissions
7. You'll be redirected back to Settings with a connected status

### 3.2 Sync Analytics Data

1. Once connected, click **Sync Now** to fetch your latest YouTube analytics
2. Navigate to **Marketing** > **Analytics** tab
3. You should see real data from your YouTube channel

## Step 4: Verify Data Sync

After connecting and syncing, verify the data in Supabase:

### Check Integration Status
```sql
SELECT * FROM analytics_integrations WHERE platform = 'youtube';
```

### Check Channel Analytics
```sql
SELECT * FROM youtube_channel_analytics ORDER BY date DESC LIMIT 10;
```

### Check Video Analytics
```sql
SELECT * FROM youtube_video_analytics ORDER BY views DESC LIMIT 10;
```

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause**: The redirect URI used by the app doesn't match any authorized URIs in Google Cloud Console.

**Solution**:
1. Check the exact URL in your browser when the error occurs
2. Add that exact URL to the Authorized redirect URIs in Google Cloud Console
3. Wait a few minutes for changes to propagate
4. Try connecting again

### Error: "Access blocked: This app's request is invalid"

**Cause**: Required APIs are not enabled or OAuth consent screen is not properly configured.

**Solution**:
1. Verify YouTube Data API v3 and YouTube Analytics API are enabled
2. Check OAuth consent screen has the correct scopes
3. If app is in "Testing" mode, make sure your Google account is added as a test user

### Error: "Failed to fetch YouTube channel info"

**Cause**: The connected Google account doesn't have a YouTube channel, or permissions were not granted.

**Solution**:
1. Ensure you're using a Google account that has a YouTube channel
2. When authorizing, make sure to check all permission boxes
3. Try disconnecting and reconnecting

### No Data Showing After Sync

**Cause**: Channel might not have recent data, or sync failed silently.

**Solution**:
1. Check browser console for errors
2. Verify data exists in Supabase tables
3. Try manually syncing again
4. Check edge function logs in Supabase dashboard

## Auto-Sync Schedule

When **Auto-sync daily** is enabled, the system will automatically fetch fresh analytics data once per day. This happens when you visit the application, not on a fixed schedule.

For true automated daily syncing, you would need to set up a scheduled job (e.g., using Supabase Edge Functions with pg_cron or an external service like GitHub Actions).

## Data Retention

- Channel analytics: Stored indefinitely, one row per day
- Video analytics: Updated on each sync, showing latest stats for top 10 videos
- Historical data is preserved for trend analysis

## Security Notes

- OAuth tokens are stored encrypted in Supabase
- Tokens automatically refresh when expired
- Only authenticated users can access their own analytics data
- Row Level Security (RLS) policies protect all data

## Next Steps

After successfully setting up YouTube:
- Consider adding other platforms (Spotify, Instagram, etc.)
- Set up dashboard alerts for milestone achievements
- Export analytics reports for stakeholders
- Monitor data sync health regularly
