# OAuth Redirect Issue - Final Diagnosis

## Problem
After successful Google authentication, users are redirected back to `/api/auth/google` instead of the dashboard.

## Root Cause
Based on your confirmation that Google Cloud Console credentials are correct, the issue is likely one of the following:

### Most Likely: Missing or Incorrect `API_BASE_URL`

The callback URL in Passport is configured as:
```typescript
callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/auth/google/callback`
```

**If `API_BASE_URL` is not set or is set incorrectly in your Cloud Run environment**, Passport will register the callback URL as `http://localhost:8080/api/auth/google/callback`, which won't match your production URL.

## Solution

### Step 1: Set Environment Variables in Cloud Run

Run these commands to set the correct environment variables:

```bash
# Set the API base URL
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars="API_BASE_URL=https://chihealth-medisecure-143169311675.us-west1.run.app"

# Explicitly set the callback URL (recommended)
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars="GOOGLE_CALLBACK_URL=https://chihealth-medisecure-143169311675.us-west1.run.app/api/auth/google/callback"
```

Replace `YOUR_SERVICE_NAME` with your actual Cloud Run service name.

### Step 2: Verify Current Environment Variables

Check what's currently set:

```bash
gcloud run services describe YOUR_SERVICE_NAME --format="value(spec.template.spec.containers[0].env)"
```

Look for:
- `API_BASE_URL`
- `GOOGLE_CALLBACK_URL`  
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`

### Step 3: Check the Logs

After updating environment variables, check the logs when the server starts:

```bash
gcloud logging read "resource.type=cloud_run_revision" --limit=20
```

Look for:
```
Google OAuth callbackURL = <the URL>
Google OAuth configured: true
```

The callback URL should be:
```
https://chihealth-medisecure-143169311675.us-west1.run.app/api/auth/google/callback
```

NOT:
```
http://localhost:8080/api/auth/google/callback
```

## Why This Causes the Issue

1. If the callback URL in Passport doesn't match what's registered in Google Cloud Console
2. Google will redirect to the registered URL after authentication
3. But Passport is listening on a different callback  URL
4. This creates a mismatch, and the authentication fails
5. The failureRedirect sends users to `/?error=sso_failed`
6. But because something's wrong, they might end up back at `/api/auth/google`

## Testing

After setting the environment variables:

1. **Restart your Cloud Run service** (deployment will happen automatically when you update env vars)
2. Wait 30 seconds for the new revision to be deployed
3. Try the OAuth flow again
4. It should work!

## Alternative: Use Explicit GOOGLE_CALLBACK_URL

Instead of relying on `API_BASE_URL`, set `GOOGLE_CALLBACK_URL` explicitly:

```bash
gcloud run services update YOUR_SERVICE_NAME \
  --set-env-vars="GOOGLE_CALLBACK_URL=https://chihealth-medisecure-143169311675.us-west1.run.app/api/auth/google/callback"
```

This is the most reliable approach.

## Quick Check Command

To see what callback URL your app is using, check the startup logs:

```bash
gcloud logging read "Google OAuth callbackURL" --limit=1
```

This will show you exactly what callback URL Passport registered with Google.
