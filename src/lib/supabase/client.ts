import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for use in browser/client components.
 * Reads env vars from the Next.js public runtime config.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
