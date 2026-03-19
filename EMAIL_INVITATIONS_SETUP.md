# Email Invitations Setup Guide

## Current Behavior

When you invite a user to The Manager:
1. The user account is created immediately in Supabase
2. The user is added to your team members list
3. The user appears in Settings → Permissions

## Why Emails Aren't Being Sent

By default, Supabase email confirmation may be disabled or email templates may not be configured. This is common in development environments.

## How Users Can Access Their Account (Without Email Configuration)

Invited users can access their account using the password reset flow:

1. Go to your login page
2. Click "Forgot Password"
3. Enter their email address
4. Receive a password reset email
5. Set their password and log in

## Setting Up Email Invitations (Optional)

If you want users to receive automatic invitation emails, follow these steps:

### 1. Enable Email Confirmations in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Under **Email Auth**, ensure these are configured:
   - Enable email confirmations (if desired)
   - Configure your SMTP settings (optional, for custom emails)

### 2. Configure Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Sent when new users are invited
   - **Invite user** - Sent for user invitations
   - **Reset password** - Sent when users request password resets

### 3. Optional: Use Custom SMTP

For production, configure custom SMTP:

1. Go to **Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Add your SMTP provider details:
   - SendGrid
   - Mailgun
   - Amazon SES
   - Or any custom SMTP server

## Alternative: Simplified Invitation Flow

The current implementation works well for small teams where you can manually notify users via:
- Slack message
- Text message
- Phone call
- In-person notification

Just tell them:
1. Their email has been added to The Manager
2. Go to the login page and click "Forgot Password"
3. Enter their email to set up their password
4. They'll receive an email to set their password

## Testing Email Flow

To test if emails are working:

1. Invite a test user with an email you can access
2. Check your inbox (and spam folder)
3. If no email arrives, emails aren't configured
4. Users can still use the "Forgot Password" flow as a workaround

## Production Recommendations

For production deployments:
- ✅ Configure custom SMTP with a reliable provider
- ✅ Customize email templates with your branding
- ✅ Test email delivery with multiple providers
- ✅ Monitor email bounce rates
- ✅ Set up SPF and DKIM records for your domain
