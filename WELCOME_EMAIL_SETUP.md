# Welcome Email Setup Guide

This guide explains how to set up automatic welcome emails when users register.

## Overview

When a user registers, they should automatically receive a welcome email with:
- Personalized greeting with their name and company name
- Information about their 14-day trial
- Quick start guide with 4 steps
- Link to dashboard
- Support information

## Implementation Status

✅ **Completed:**
- Welcome email template created in `lib/email/resend.ts`
- API endpoint created at `app/api/welcome-email/route.ts`
- Database trigger updated in `scripts/190_add_welcome_email_to_trigger.sql`

⚠️ **Pending Setup:**
- Enable pg_net extension in Supabase (or use alternative approach)
- Configure API URL in database settings
- Test welcome email flow

## Setup Options

### Option 1: Using pg_net Extension (Recommended for Production)

This approach allows the database trigger to directly call the API endpoint.

#### Steps:

1. **Enable pg_net extension in Supabase:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Configure API URL in database:**
   
   For production:
   ```sql
   ALTER DATABASE postgres SET app.settings.api_url = 'https://your-domain.com';
   ```
   
   For local development:
   ```sql
   ALTER DATABASE postgres SET app.settings.api_url = 'http://localhost:3000';
   ```

3. **Run the trigger update script:**
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `scripts/190_add_welcome_email_to_trigger.sql`
   - Execute the script

4. **Verify environment variables:**
   - Ensure `RESEND_API_KEY` is set in your environment
   - Ensure `RESEND_FROM_EMAIL` is set (e.g., "onboarding@yourdomain.com")
   - Ensure `NEXT_PUBLIC_APP_URL` is set for the dashboard link

5. **Test the flow:**
   - Register a new user
   - Check that the welcome email is received
   - Check Supabase logs for any errors

### Option 2: Using Supabase Webhooks (Alternative)

If pg_net is not available, you can use Supabase Database Webhooks.

#### Steps:

1. **Create a webhook in Supabase:**
   - Go to Database → Webhooks
   - Create new webhook
   - Table: `auth.users`
   - Events: `INSERT`
   - HTTP Request:
     - Method: `POST`
     - URL: `https://your-domain.com/api/welcome-email`
     - HTTP Headers: `Content-Type: application/json`

2. **Configure webhook payload:**
   ```json
   {
     "email": "{{ record.email }}",
     "userName": "{{ record.raw_user_meta_data.full_name }}",
     "companyName": "{{ record.raw_user_meta_data.company_name }}"
   }
   ```

3. **Test the webhook:**
   - Register a new user
   - Check webhook logs in Supabase
   - Verify email is received

### Option 3: Client-Side Call (Simplest for Development)

For quick testing or if database-level integration is not possible.

#### Steps:

1. **Update the sign-up page** (`app/auth/sign-up/page.tsx`):
   
   Add this after successful sign-up (around line 50):
   ```typescript
   // After successful sign-up
   if (!error) {
     // Send welcome email
     try {
       await fetch('/api/welcome-email', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           email,
           userName: fullName,
           companyName: companyName || 'Tu Empresa'
         })
       });
     } catch (emailError) {
       console.error('Failed to send welcome email:', emailError);
       // Don't fail registration if email fails
     }
     
     setSuccess(true);
     setLoading(false);
   }
   ```

2. **Test:**
   - Register a new user
   - Check that welcome email is received
   - Check browser console for any errors

## Testing

### Manual Test:

You can test the welcome email API directly:

```bash
curl -X POST http://localhost:3000/api/welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userName": "Test User",
    "companyName": "Test Company"
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "some-message-id"
}
```

### Integration Test:

1. Register a new user through the sign-up form
2. Check the email inbox for the welcome email
3. Verify all personalization is correct (name, company name)
4. Click the "Ir al Dashboard" button to ensure the link works
5. Check Supabase logs for any errors

## Troubleshooting

### Email not received:

1. **Check environment variables:**
   - Verify `RESEND_API_KEY` is set correctly
   - Verify `RESEND_FROM_EMAIL` is a verified domain in Resend

2. **Check API logs:**
   - Look for errors in the Next.js console
   - Check Supabase function logs

3. **Check Resend dashboard:**
   - Go to Resend dashboard
   - Check "Emails" section for delivery status
   - Look for any bounces or errors

### pg_net not available:

If you get an error about `net.http_post` not existing:
- pg_net extension is not enabled
- Use Option 2 (Webhooks) or Option 3 (Client-side) instead

### API URL not configured:

If you see warnings about API URL in Supabase logs:
- Run the `ALTER DATABASE` command to set `app.settings.api_url`
- Or use an alternative approach (Options 2 or 3)

## Email Template Customization

To customize the welcome email template, edit `lib/email/resend.ts`:

- Change colors by modifying the gradient values
- Update the onboarding steps
- Add your company logo
- Modify the support information
- Change the dashboard URL

## Security Notes

- The API endpoint validates required fields
- Emails are sent asynchronously to avoid blocking user registration
- Failed email sends are logged but don't prevent user creation
- The trigger function has SECURITY DEFINER to ensure proper permissions

## Next Steps

After setting up welcome emails:

1. Consider adding more email templates:
   - Trial expiration reminder (7 days before)
   - Trial expired notification
   - Subscription confirmation
   - Payment receipt

2. Track email engagement:
   - Monitor open rates in Resend dashboard
   - Track click-through rates on dashboard link
   - Analyze which onboarding steps users complete

3. A/B test email content:
   - Test different subject lines
   - Try different onboarding step orders
   - Experiment with call-to-action buttons
