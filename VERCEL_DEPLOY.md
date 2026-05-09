# Deploy ke Vercel

## Langkah cepat
1. Push repo ini ke GitHub.
2. Di Vercel → **New Project** → import repo.
3. Framework Preset: **Other** (biarkan).
4. Build Command: `bun run build` (otomatis dari `vercel.json`).
5. Output Directory: `dist/client` (otomatis dari `vercel.json`).
6. Tambahkan **Environment Variables** (Project Settings → Environment Variables):
   - `VITE_SUPABASE_URL` = `https://bzumjsearxduztocfmve.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = (lihat `.env`)
   - `VITE_SUPABASE_PROJECT_ID` = `bzumjsearxduztocfmve`
7. Deploy.

## Catatan penting
- Project ini aslinya target **Cloudflare Workers** (lewat preset Lovable). Di Vercel,
  hasilnya dideploy sebagai **SPA static** dengan SSR dimatikan secara efektif
  (rewrite semua route ke `index.html`).
- **Server functions TanStack** (`createServerFn`) tidak akan dieksekusi di Vercel
  dengan setup ini. Pindahkan logikanya ke **Supabase Edge Functions**
  (`supabase/functions/*`) — sudah aktif dan bisa dipanggil dari client via
  `supabase.functions.invoke(...)`.
- Database, auth, storage, dan AI tetap jalan via Lovable Cloud (Supabase).

## Custom domain
Settings → Domains → tambahkan domain → ikuti instruksi DNS Vercel.
