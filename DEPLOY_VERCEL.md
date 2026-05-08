# Deploying FinScope to Vercel

This project is **Vercel-ready**. Follow the steps below for a clean deploy.

## 1. Prerequisites

- A Vercel account (https://vercel.com)
- A Supabase / Lovable Cloud project (database + edge functions)
- Bun ≥ 1.1 locally (Vercel auto-detects via `bun.lock`)

## 2. Environment Variables

Copy `.env.example` → set the same keys in
**Vercel → Project → Settings → Environment Variables** for
`Production`, `Preview`, and `Development`.

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | Browser client URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | Browser anon key |
| `VITE_SUPABASE_PROJECT_ID` | Public | Project ref |
| `SUPABASE_URL` | Server | SSR / server functions |
| `SUPABASE_PUBLISHABLE_KEY` | Server | SSR / server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (secret) | Admin operations |
| `LOVABLE_API_KEY` | Server (secret) | AI gateway (edge functions) |

> Never prefix the service-role key with `VITE_`. It must stay server-only.

## 3. Build & Output

`vercel.json` is preconfigured for TanStack Start + Nitro on Vercel:

```json
{
  "framework": "tanstack-start",
  "buildCommand": "bun run build",
  "installCommand": "bun install"
}
```

Do **not** set `outputDirectory` manually. The Nitro Vercel adapter writes the
correct Build Output API files into `.vercel/output`, including the server
function that handles `/`, `/companies/:id`, refreshes, and deep links.

## 4. Edge Functions / Database

The Supabase edge functions in `supabase/functions/*` (`analyze`, `chat`,
`forecast`, `parse-pdf`) and SQL migrations in `supabase/migrations/*`
deploy to **Lovable Cloud / Supabase**, not Vercel. They are reachable from
any frontend (including the one Vercel hosts) via `VITE_SUPABASE_URL`.

To deploy them manually:

```bash
supabase link --project-ref <YOUR-REF>
supabase db push
supabase functions deploy analyze chat forecast parse-pdf
supabase secrets set LOVABLE_API_KEY=...
```

## 5. Deploy

```bash
# Option A — Git integration (recommended)
git push   # Vercel auto-builds on push

# Option B — CLI
npx vercel --prod
```

## 6. Verify

After deploy, check:
- `/` loads the dashboard
- `/analyze` → "Load Sample" → "Run AI Analysis" returns a result (verifies edge functions + env vars)
- Browser console has no `Missing Supabase environment variable` errors
