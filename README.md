# terminal-portfolio

Personal site built with Next.js 15.

## Runtime stack
- Hosting: Vercel
- Database: Supabase Postgres (`content_items` table)
- Admin auth: cookie session signed with `ADMIN_TOKEN_SECRET`
- Admin password verification: bcrypt hash in `ADMIN_PASSWORD_HASH`

## Local setup
1. Copy `.env.example` to `.env.local` and fill values.
2. Install dependencies:
   - `npm install`
3. Apply schema in Supabase SQL editor:
   - `supabase/schema.sql`
4. Start dev server:
   - `npm run dev`

## Scripts
- `npm run build`: production build
- `npm run hash:admin-password -- "your-password"`: generate bcrypt hash for env var
- `npm run backup:export`: export `content_items` to `backups/YYYY-MM-DD/content-items.json`

## Data safety docs
- Recovery attempt playbook: `docs/recovery-playbook.md`
- Monthly restore drill checklist: `docs/restore-drill-checklist.md`
- Recovered content staging: `recovered-content/README.md`
