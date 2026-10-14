import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js middleware - runs on every request.
 * Handles Supabase auth session refresh and route protection.
 * 
 * NOTE: For Phase 1 demo, this middleware is disabled.
 * Uncomment the updateSession call when Supabase is connected.
 */
export async function middleware(request: NextRequest) {
  // TODO: Enable when Supabase is connected
  // return await updateSession(request);
  
  // For Phase 1 demo, allow all routes
  return;
}

export const config = {
  matcher: [
    // Match all routes except static files, seo files and API routes
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html)$).*)',
  ],
};
