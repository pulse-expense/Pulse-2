# Pulse v16 — React Modernization

Pulse has been migrated from the previous single-file HTML/vanilla-JS architecture to a React + Vite application while retaining Supabase Auth/PostgreSQL as the cloud data layer.

## Architecture
- React 19 + Vite for reactive UI and componentized state
- Supabase Auth + PostgreSQL for identity and persistent data
- Supabase Realtime subscriptions for live expense/budget/wealth updates
- Node.js + Express API foundation for server-side jobs/integrations
- PWA/service-worker support for the GitHub Pages project URL

## Existing data model
The React data layer uses the existing tables: `expenses`, `categories`, `payment_methods`, `payers`, `budgets`, `pulse_goals`, `pulse_net_worth`, `pulse_recurring_plans`, and `pulse_reminders`.

## Development
```bash
npm install
# set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
npm run dev
npm run build
```

## GitHub Pages
This repository is configured for the project site `/pulse-2/` through `vite.config.js`.

## Security
Only the Supabase publishable key belongs in browser configuration. Never commit a Supabase secret/service-role key. Node server secrets belong in server deployment environment variables only.

## Migration strategy
The old single-file implementation remains available on `main` until this modernization branch is validated and merged. This branch is the isolated upgrade path so the production build is not replaced blindly.