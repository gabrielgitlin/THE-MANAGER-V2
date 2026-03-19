# The Manager - Deployment Guide

## Domain Setup: themanager.music

### 1. Vercel Configuration

#### Add Custom Domain in Vercel Dashboard:
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add domain: `themanager.music`
4. Add domain: `www.themanager.music` (optional)

#### DNS Configuration:
Add the following DNS records in your domain registrar:

**For root domain (themanager.music):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### 2. Environment Variables

Update your production environment variables in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Add/Update the following:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
VITE_GOOGLE_REDIRECT_URI=https://themanager.music/calendar
```

### 3. Google OAuth Configuration

Update your Google Cloud Console OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   - `https://themanager.music/calendar`
   - `http://localhost:5173/calendar` (for local development)
6. Save changes

### 4. Supabase Edge Functions

Update edge function environment variables if needed:
- The edge functions should already be configured with the correct URLs
- Verify they're using the production Supabase URL

### 5. Testing Checklist

After deployment, test the following:

- [ ] Landing page loads at `https://themanager.music`
- [ ] Login redirects to `/dashboard` when authenticated
- [ ] Google Calendar OAuth flow works correctly
- [ ] All protected routes require authentication
- [ ] Supabase connection is working
- [ ] Edge functions are accessible

### 6. SSL Certificate

Vercel automatically provisions and renews SSL certificates for your domain.
Wait a few minutes after adding the domain for the certificate to be issued.

### 7. Force HTTPS

Ensure HTTPS is enforced:
1. In Vercel Dashboard → **Settings** → **Domains**
2. Toggle "Force HTTPS" for your domain

---

## Development vs Production

### Local Development:
- URL: `http://localhost:5173`
- OAuth Redirect: `http://localhost:5173/calendar`
- Run: `npm run dev`

### Production:
- URL: `https://themanager.music`
- OAuth Redirect: `https://themanager.music/calendar`
- Deploy: Push to main branch (auto-deploys via Vercel)

---

## Notes

- The landing page is now the default route (`/`) for non-authenticated users
- Authenticated users are automatically redirected to `/dashboard`
- All internal routes now start with `/dashboard`, `/calendar`, etc.
- The app is fully responsive and optimized for production use
