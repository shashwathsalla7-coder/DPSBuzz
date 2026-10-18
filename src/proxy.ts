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
    pathname.startsWith('/icon')
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

  // If already logged in on this device and visiting /login or /signup, direct to /home
  if (isAuthRoute && hasValidUser && !isLogout) {
    return NextResponse.redirect(new URL('/home', request.url));
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

  // 6. Protected student routes - require saved user on this device
  const isProtectedRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/chats') ||
    pathname.startsWith('/game') ||
    pathname.startsWith('/games') ||
    pathname.startsWith('/cricket') ||
    pathname.startsWith('/post') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/notices') ||
    pathname.startsWith('/leaderboard');

  if (isProtectedRoute && !hasValidUser) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  }

  // On all private / protected responses, always set X-Robots-Tag header
  const response = NextResponse.next();
  if (isProtectedRoute || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html)$).*)',
  ],
};
