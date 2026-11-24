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

## PDFs in writings
A markdown link to a PDF on a line of its own renders as an embedded reader; a PDF link inside a sentence stays a normal link.

1. Commit the file under `public/pdfs/` (or host it elsewhere and use the full `https://` URL).
2. In the writing's content, put the link in its own paragraph:

   ```md
   [Manuscript title (draft)](/pdfs/manuscript-draft.pdf)
   ```

Phones and browsers without a built-in PDF viewer get an "open pdf" link instead of the reader.

## Data safety docs
- Recovery attempt playbook: `docs/recovery-playbook.md`
- Monthly restore drill checklist: `docs/restore-drill-checklist.md`
- Recovered content staging: `recovered-content/README.md`
