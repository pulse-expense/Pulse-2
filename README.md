# Pulse — Google Login Clean Build

This build is prepared for the existing GitHub Pages deployment:

https://prem0592.github.io/pulse-2/

## Upload these files to the GitHub repository

Replace:

1. index.html
2. manifest.json
3. sw.js

Keep your existing `config.js` unchanged.

Do NOT upload `config.example.js` as `config.js` unless you first replace its placeholders with your actual Supabase project URL and publishable key.

## Google Login

The login screen now includes:

**Continue with Google**

The app uses Supabase Auth OAuth and redirects back to the current GitHub Pages path.

## Supabase / Google setup

In Supabase:

Authentication → Providers → Google → enable Google.

Use your Google OAuth Client ID and Client Secret there.

For the Google OAuth provider, configure the Supabase callback URL shown by your Supabase project. Do not use the GitHub Pages URL as the Google provider callback unless Supabase specifically tells you to.

Also make sure the GitHub Pages URL is allowed in:

Authentication → URL Configuration → Redirect URLs

Recommended application URL:

https://prem0592.github.io/pulse-2/

## Security

Keep only the Supabase publishable key in browser-side `config.js`.

Never put a `sb_secret_...` or service-role key in:
- index.html
- config.js
- GitHub
- any browser-accessible file

## Deployment

1. Extract this ZIP.
2. Replace `index.html`, `manifest.json`, and `sw.js` in your GitHub repository.
3. Keep your existing `config.js`.
4. Commit and push.
5. Wait for GitHub Pages deployment.
6. Open the site in a private/incognito window for the first test.
7. Click **Continue with Google**.

The service-worker cache name has been bumped so the new login page can be picked up instead of the previous cached version.
