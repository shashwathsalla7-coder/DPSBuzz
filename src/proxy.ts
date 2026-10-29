import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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

  // 2. Read user session cookie
  const userCookie = request.cookies.get('dpsbuzz_user')?.value;
  let hasValidUser = false;

  if (userCookie) {
    try {
      const decoded = decodeURIComponent(userCookie);
      const user = JSON.parse(decoded);
      if (user && user.username && user.username.toLowerCase() !== 'guest') {
        hasValidUser = true;
      }
    } catch {
      hasValidUser = false;
    }
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
    pathname.startsWith('/download');

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
    const adminSession = request.cookies.get('dpsbuzz_admin_session')?.value;
    let isSuperAdmin = false;

    if (adminSession) {
      try {
        const decoded = JSON.parse(Buffer.from(adminSession, 'base64').toString('utf8'));
        if (decoded && decoded.username === 'shashwath71845' && decoded.role === 'admin') {
          isSuperAdmin = true;
        }
      } catch {}
    }

    if (!isSuperAdmin && userCookie) {
      try {
        const decoded = decodeURIComponent(userCookie);
        const user = JSON.parse(decoded);
        if (user && user.username === 'shashwath71845' && user.role === 'admin') {
          isSuperAdmin = true;
        }
      } catch {}
    }

    if (!isSuperAdmin) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res;
    }
  }

  // 6. Public API endpoints that don't require an active student session
  const isPublicApi =
    pathname.startsWith('/api/download') ||
    pathname === '/api/admin/login' ||
    pathname === '/api/media/sign-read' ||
    pathname === '/api/upload/presign';

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
