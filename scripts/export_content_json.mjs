import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const date = new Date().toISOString().slice(0, 10);
const outDir = path.join(process.cwd(), 'backups', date);
const outFile = path.join(outDir, 'content-items.json');

const { data, error } = await supabase
  .from('content_items')
  .select('*')
  .order('content_type', { ascending: true })
  .order('slug', { ascending: true });

if (error) {
  console.error(`Export failed: ${error.message}`);
  process.exit(1);
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(
  outFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: data?.length ?? 0,
      items: data ?? [],
    },
    null,
    2
  )}\n`,
  'utf8'
);

console.log(`Export complete: ${outFile}`);
