# Email Setup Guide for THE MANAGER

This guide explains how to set up email sending for guest list ticket confirmations.

## Overview

THE MANAGER uses **Resend** (a modern email API) to send ticket confirmation emails when you mark guest list tickets as sent. Resend provides reliable email delivery with excellent deliverability rates.

## Prerequisites

- A Supabase project (already set up)
- A Resend account (free tier available)
- A verified domain or email address for sending

## Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Your Domain (Recommended for Production)

For production use, you should add and verify your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `themanager.app`)
4. Add the DNS records shown to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

**For Testing:** You can skip this and use the `onboarding@resend.dev` email for testing.

## Step 3: Get Your API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "THE MANAGER Production")
4. Select **Full Access** or **Sending Access**
5. Click **Add**
6. **IMPORTANT:** Copy the API key - you won't be able to see it again!

The API key will look like: `re_123abc456def789ghi...`

## Step 4: Deploy the Edge Function

The edge function has already been created at:
`supabase/functions/send-ticket-email/index.ts`

Deploy it using the Supabase CLI or through the Supabase dashboard.

## Step 5: Add API Key to Supabase

You need to add your Resend API key as a secret to your Supabase Edge Function:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click on **Manage Secrets** or go to **Project Settings > Edge Functions**
4. Add a new secret:
   - **Key:** `RESEND_API_KEY`
   - **Value:** Your Resend API key (starts with `re_`)
5. Click **Save**

### Option B: Using Supabase CLI

```bash
# Set the secret
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Verify it was set
supabase secrets list
```

## Step 6: Update the "From" Email Address

In the edge function (`supabase/functions/send-ticket-email/index.ts`), update the `from` field to use your verified domain:

```typescript
from: "The Manager <noreply@yourdomain.com>",  // Update this line
```

If you haven't verified a domain yet, you can use:
```typescript
from: "onboarding@resend.dev",  // For testing only
```

## Step 7: Test the Email Sending

1. Go to a show in THE MANAGER
2. Navigate to the **Guest List** tab
3. Add a guest with:
   - Name: Your name
   - Type: VIP (or any type)
   - Status: Approved
   - **Contact Info:** Your email address (e.g., `your.email@example.com`)
4. Click **Send Tickets**
5. Confirm the action
6. Check your email inbox (and spam folder)

## Email Template

The ticket confirmation email includes:

- Guest name and event details
- Show title and venue
- Date and time
- Number of tickets
- Guest type (VIP, Industry, etc.)
- Important information (arrival time, ID requirements, etc.)

The email is professionally designed with your branding colors and includes all necessary information for the guest to attend the show.

## Troubleshooting

### "RESEND_API_KEY is not configured" Error

**Solution:** Make sure you've added the `RESEND_API_KEY` secret to your Supabase Edge Functions (see Step 5).

### "No valid email address found" Error

**Solution:** Make sure the guest's **Contact Info** field contains a valid email address. The system will extract the email from this field.

### Email Not Received

**Possible causes:**
1. **Check spam folder** - First-time emails from new domains often go to spam
2. **Wrong email address** - Verify the email in the Contact Info field
3. **Domain not verified** - If using your own domain, make sure it's verified in Resend
4. **Rate limits** - Resend free tier has limits; check your Resend dashboard

### "Failed to send email" Error

**Debug steps:**
1. Check your Supabase Edge Function logs:
   - Go to **Edge Functions** in Supabase dashboard
   - Click on `send-ticket-email`
   - View **Invocations** and **Logs**

2. Check your Resend dashboard:
   - Go to **Logs** in Resend
   - See if the API request was received
   - Check for any error messages

3. Verify the API key is correct:
   - Make sure the `RESEND_API_KEY` secret is set correctly
   - No extra spaces or quotes around the key

## Email Customization

To customize the email template, edit:
`supabase/functions/send-ticket-email/index.ts`

Look for the `generateTicketEmail()` function. You can modify:
- Colors and styling
- Logo and branding
- Additional information
- Footer text

After making changes, redeploy the edge function:

```bash
# If using Supabase CLI
supabase functions deploy send-ticket-email
```

## Production Best Practices

1. **Use a verified domain** - Don't use `onboarding@resend.dev` in production
2. **Add SPF/DKIM records** - Improves email deliverability
3. **Monitor your logs** - Check Supabase and Resend logs regularly
4. **Set up email notifications** - Get alerted if emails fail
5. **Test thoroughly** - Send test emails before using in production

## Cost

**Resend Pricing:**
- Free tier: 100 emails/day, 3,000 emails/month
- Pro plan: $20/month for 50,000 emails/month
- Volume discounts available

For most artist management needs, the free tier is sufficient. Upgrade if you're managing multiple large tours.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase Edge Function logs
3. Check Resend dashboard logs
4. Contact Resend support (very responsive)

## Security Notes

- **Never** commit API keys to your code repository
- Store API keys only in Supabase secrets
- Use environment variables for development
- Rotate API keys periodically
- Monitor usage in Resend dashboard

---

## Quick Setup Checklist

- [ ] Create Resend account
- [ ] Get API key from Resend
- [ ] Add `RESEND_API_KEY` to Supabase secrets
- [ ] Deploy edge function (if not already deployed)
- [ ] Update "from" email address in function
- [ ] Test with a real email address
- [ ] Verify email received
- [ ] Check email rendering in different clients
- [ ] (Optional) Add and verify custom domain
- [ ] (Production) Remove test/onboarding email addresses

---

**You're all set!** Guests will now receive professional ticket confirmation emails when you mark their tickets as sent.
