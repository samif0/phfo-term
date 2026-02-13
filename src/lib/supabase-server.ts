import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase-types';

let supabaseClient: SupabaseClient<Database> | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function getSupabaseServerClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient<Database>(
    getRequiredEnv('SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return supabaseClient;
}
