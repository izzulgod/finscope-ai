# Deploy ke Vercel

Aplikasi ini siap deploy ke Vercel sebagai **SPA static**. Semua backend
(AI analysis, parse PDF, chat, forecast) berjalan di **Lovable Cloud Edge
Functions** — tidak ada server runtime yang perlu di-host di Vercel.

## Langkah deploy

1. Push repo ini ke GitHub.
2. Di Vercel → **New Project** → import repo.
3. Framework Preset: **Other** (biarkan default).
4. Build Command: `bun run build` (otomatis dari `vercel.json`).
5. Output Directory: `dist/client` (otomatis dari `vercel.json`).
6. Tambahkan **Environment Variables** (Project Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://bzumjsearxduztocfmve.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = (lihat `.env`)
   - `VITE_SUPABASE_PROJECT_ID` = `bzumjsearxduztocfmve`
7. Deploy.

## Arsitektur runtime

| Lapisan | Berjalan di | Catatan |
| --- | --- | --- |
| UI React + routing | Vercel CDN (static) | TanStack Router file-based, di-rewrite ke `index.html` |
| Database, Auth, Storage | Lovable Cloud (Supabase) | Diakses via `@/integrations/supabase/client` |
| AI: `analyze`, `chat`, `parse-pdf`, `forecast` | Lovable Cloud Edge Functions | Dipanggil via `supabase.functions.invoke(...)` |

Tidak ada `createServerFn` (TanStack Start server functions) yang digunakan di
project ini, sehingga deploy SPA murni di Vercel berjalan penuh tanpa fitur
yang hilang. Jika nanti Anda butuh server function bersamaan dengan hosting
Vercel, pilihannya: (a) pindahkan logikanya ke Edge Function baru di
`supabase/functions/*`, atau (b) deploy ke Cloudflare Workers (sesuai preset
asli template).

## Custom domain

Vercel → Settings → Domains → tambahkan domain → ikuti instruksi DNS.
