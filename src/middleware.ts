import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Static files & public assets - allow always
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/favicon.ico')
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

  // 3. Root path '/'
  if (pathname === '/') {
    if (hasValidUser && !isLogout) {
      return NextResponse.redirect(new URL('/home', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Public auth paths
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isDownloadRoute = pathname === '/download' || pathname.startsWith('/download');
  const isAdminLoginRoute = pathname === '/admin/login';

  // If already logged in on this device and visiting /login or /signup, direct to /home
  if (isAuthRoute && hasValidUser && !isLogout) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Allow download & admin login
  if (isDownloadRoute || isAdminLoginRoute) {
    return NextResponse.next();
  }

  // 5. Protected student routes - require saved user on this device
  const isProtectedRoute =
    pathname.startsWith('/home') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/chats') ||
    pathname.startsWith('/post') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/groups') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/admin');

  if (isProtectedRoute && !hasValidUser) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|html)$).*)',
  ],
};
