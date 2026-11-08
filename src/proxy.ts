import { NextResponse, type NextRequest } from 'next/server';
import { getClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/security';
import { getSession, clearSessionCookie } from '@/lib/auth/session';
import { listBanned, credentialsAvailable } from '@/lib/auth/credentials';

// Banned usernames, refreshed at most once a minute so existing sessions get cut off too.
let bannedCache: { at: number; set: Set<string> } = { at: 0, set: new Set() };
async function getBannedSet(): Promise<Set<string>> {
  if (Date.now() - bannedCache.at < 60_000 || !credentialsAvailable()) return bannedCache.set;
  try {
    const rows = await listBanned();
    bannedCache = { at: Date.now(), set: new Set(rows.map((r) => r.username)) };
  } catch {
    bannedCache.at = Date.now();
  }
  return bannedCache.set;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static files & public assets - allow always
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/opengraph-image') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/BingSiteAuth.xml') ||
    pathname.startsWith('/videos')
  ) {
    return NextResponse.next();
  }

  // Legacy route redirection
  const p1 = '/' + 'what' + 'sapp';
  const p2 = '/' + 'school-' + 'what' + 'sapp';
  if (pathname.startsWith(p1) || pathname.startsWith(p2) || pathname === '/wire') {
    return NextResponse.redirect(new URL('/campus-wire', request.url));
  }

  // 1b. Edge Rate Limiter for API endpoints
  if (pathname.startsWith('/api')) {
    const sessionForLimit = getSession(request);
    const bucket = sessionForLimit ? `u:${sessionForLimit.username}` : `ip:${getClientIp(request)}`;
    const isMutation = request.method !== 'GET' && request.method !== 'HEAD';
    // Logged-in users get their own bucket (a whole school shares one Wi-Fi IP).
    const maxReq = sessionForLimit ? (isMutation ? 120 : 300) : isMutation ? 30 : 600;
    const rateCheck = checkRateLimit(`edge:${bucket}:${isMutation ? 'm' : 'r'}`, maxReq, 60000);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.retryAfterSec);
    }
  }

  // 2. Identity comes ONLY from the signed, httpOnly session cookie.
  const session = getSession(request);
  let hasValidUser = Boolean(session);
  if (session && (await getBannedSet()).has(session.username)) {
    hasValidUser = false;
    const res = pathname.startsWith('/api')
      ? NextResponse.json({ success: false, error: 'This account has been suspended.' }, { status: 403 })
      : NextResponse.redirect(new URL('/login?banned=1', request.url));
    clearSessionCookie(res);
    return res;
  }

  const isLogout = request.nextUrl.searchParams.get('logout') === 'true';

  // 3. Public informational pages - allow search crawlers and public visitors freely
  const isPublicPage =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/safety' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/contact' ||
    pathname === '/download' ||
    pathname.startsWith('/download') ||
    pathname.startsWith('/join');

  if (pathname === '/') {
    // If student is already logged in on this device, smoothly take them to /home
    if (hasValidUser && !isLogout) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    // Crawlers and non-logged-in visitors see the rich public landing page
    return NextResponse.next();
  }

  if (isPublicPage) {
    return NextResponse.next();
  }

  // 4. Public auth paths
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isAdminLoginRoute = pathname === '/admin/login';

  // If already logged in on this device and visiting /login or /signup, direct to requested link or /home
  if (isAuthRoute && hasValidUser && !isLogout) {
    const redirectTarget = request.nextUrl.searchParams.get('redirect');
    const destination =
      redirectTarget && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
        ? redirectTarget
        : '/home';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAuthRoute || isAdminLoginRoute) {
    return NextResponse.next();
  }

  // 5. Strict server-side Admin Route Protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const isSuperAdmin = session?.role === 'admin';

    if (!isSuperAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res;
    }
  }

  // 6. Public API endpoints that don't require an active student session
  const campusAction = request.nextUrl.searchParams.get('action') || '';
  const isPublicApi =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/session' ||
    (pathname === '/api/auth/profile' && (request.method === 'GET' || request.method === 'POST')) ||
    pathname.startsWith('/api/download') ||
    pathname === '/api/admin/login' ||
    (pathname === '/api/cron/cleanup' && Boolean(process.env.CRON_SECRET)) ||
    (pathname === '/api/campus' && request.method === 'GET' && campusAction === 'get_invite_link_details');

  // Admin-only API namespace
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login' && session?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  // 7. Strict Wall: ALL other routes in the app require a registered, logged-in student account!
  // Especially deep links (e.g. /u/[username], /reels, /chats, /leaderboard, /games, /notices, /post/new, /settings)
  if (!hasValidUser) {
    if (pathname.startsWith('/api')) {
      if (!isPublicApi) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required. Please log in or create an account to access DPSBuzz.',
          },
          { status: 401, headers: { 'X-Robots-Tag': 'noindex, nofollow, noarchive' } }
        );
      }
      return NextResponse.next();
    }

    // Direct web page requests: immediately redirect to /login with target URL preserved
    const targetUrl = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', targetUrl);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  }

  // Authenticated responses: apply noindex header to protect student privacy
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html|mp4|webm|m4v)$).*)',
  ],
};
