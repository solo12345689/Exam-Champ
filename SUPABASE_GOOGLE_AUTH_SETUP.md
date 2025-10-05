# Setting Up Google Authentication in Supabase

The error message `Unsupported provider: provider is not enabled` indicates that Google authentication is not properly configured in your Supabase project. Follow these steps to enable it:

## Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in to your account
3. Select your project

## Step 2: Configure Google Authentication

1. In the left sidebar, click on **Authentication**
2. Click on **Providers**
3. Find **Google** in the list of providers
4. Toggle the switch to enable Google authentication

## Step 3: Set Up Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Set the application type to **Web application**
6. Add a name for your OAuth client
7. Add the following URLs to the **Authorized JavaScript origins**:
   - `https://[YOUR_PROJECT_REF].supabase.co` (your Supabase project URL)
   - `http://localhost:3000` (for local development)
   - Your production domain if you have one

8. Add the following URLs to the **Authorized redirect URIs**:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
   - Your production domain callback URL if you have one: `https://[YOUR_DOMAIN]/auth/callback`

9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

## Step 4: Add Google OAuth Credentials to Supabase

1. Return to the Supabase dashboard
2. Go to **Authentication** > **Providers** > **Google**
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console
4. Click **Save**

## Step 5: Test the Authentication

1. Go to your application
2. Try to sign in with Google
3. You should now be able to authenticate successfully

## Troubleshooting

If you're still experiencing issues:

1. Make sure the redirect URIs in Google Cloud Console exactly match the ones Supabase expects
2. Check that you've enabled the Google People API in your Google Cloud project
3. Verify that your Supabase project URL is correctly set in your application's environment variables
4. Clear your browser cache and try again

For more detailed information, refer to the [Supabase documentation on Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google).