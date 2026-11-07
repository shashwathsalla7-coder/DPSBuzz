import { createBrowserClient } from '@supabase/ssr';

const GLOBAL_CLIENT_KEY = '__DPSBUZZ_SUPABASE_BROWSER_CLIENT__';

/**
 * Create a Supabase client for use in browser/client components.
 * Attaches to global window to guarantee a single GoTrueClient instance across hot-reloads and chunks.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  if (typeof window === 'undefined') {
    return createBrowserClient(url, anonKey);
  }

  const win = window as any;
  if (!win[GLOBAL_CLIENT_KEY]) {
    win[GLOBAL_CLIENT_KEY] = createBrowserClient(url, anonKey);
  }
  return win[GLOBAL_CLIENT_KEY];
}
