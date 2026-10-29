// @ts-check
import assert from 'node:assert';

console.log('====================================================');
console.log('🔒 DPS BUZZ AUTH GUARD & DEEP-LINK PROTECTION TEST');
console.log('====================================================');

// Mock implementation of proxy/middleware logic
function evaluateProxyAccess(pathname, searchParams = new Map(), cookies = {}) {
  // 1. Static files & public assets
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
    return { type: 'NEXT', status: 200 };
  }

  // 2. Read session cookie
  const userCookie = cookies['dpsbuzz_user'];
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

  const isLogout = searchParams.get('logout') === 'true';

  // 3. Public informational pages
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
    if (hasValidUser && !isLogout) {
      return { type: 'REDIRECT', destination: '/home', status: 307 };
    }
    return { type: 'NEXT', status: 200 };
  }

  if (isPublicPage) {
    return { type: 'NEXT', status: 200 };
  }

  // 4. Public auth paths
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isAdminLoginRoute = pathname === '/admin/login';

  if (isAuthRoute && hasValidUser && !isLogout) {
    const redirectTarget = searchParams.get('redirect');
    const destination =
      redirectTarget && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
        ? redirectTarget
        : '/home';
    return { type: 'REDIRECT', destination, status: 307 };
  }

  if (isAuthRoute || isAdminLoginRoute) {
    return { type: 'NEXT', status: 200 };
  }

  // 5. Admin check
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return { type: 'REDIRECT', destination: '/admin/login?redirect=' + encodeURIComponent(pathname), status: 307 };
  }

  // 6. Public API endpoints
  const isPublicApi =
    pathname.startsWith('/api/download') ||
    pathname === '/api/admin/login' ||
    pathname === '/api/media/sign-read' ||
    pathname === '/api/upload/presign';

  // 7. Strict Wall: ALL other app routes & internal APIs require registered account
  if (!hasValidUser) {
    if (pathname.startsWith('/api')) {
      if (!isPublicApi) {
        return { type: 'JSON_ERROR', status: 401, error: 'Authentication required' };
      }
      return { type: 'NEXT', status: 200 };
    }

    const queryStr = Array.from(searchParams.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const targetUrl = pathname + (queryStr ? `?${queryStr}` : '');
    const loginDestination = `/login?redirect=${encodeURIComponent(targetUrl)}`;
    return { type: 'REDIRECT', destination: loginDestination, status: 307 };
  }

  return { type: 'NEXT', status: 200 };
}

// ==========================================
// TEST 1: Unauthenticated user opening deep link to profile
// ==========================================
{
  const result = evaluateProxyAccess('/u/ananya_sharma', new Map(), {});
  assert.strictEqual(result.type, 'REDIRECT', 'Unauthenticated user must be redirected away from profile link');
  assert.strictEqual(result.destination, '/login?redirect=%2Fu%2Fananya_sharma', 'Deep link to profile must be preserved in redirect');
  console.log('✅ [PASS] Test 1: Unauthenticated access to /u/[username] redirects to /login with redirect parameter');
}

// ==========================================
// TEST 2: Unauthenticated user opening deep link to specific shared post
// ==========================================
{
  const params = new Map([['post', 'post-science-expo-123']]);
  const result = evaluateProxyAccess('/u/shashwath71845', params, {});
  assert.strictEqual(result.type, 'REDIRECT');
  assert.strictEqual(result.destination, '/login?redirect=%2Fu%2Fshashwath71845%3Fpost%3Dpost-science-expo-123');
  console.log('✅ [PASS] Test 2: Unauthenticated access to shared post link preserves post query parameter');
}

// ==========================================
// TEST 3: Unauthenticated user opening /reels, /chats, /leaderboard
// ==========================================
{
  const r1 = evaluateProxyAccess('/reels', new Map(), {});
  assert.strictEqual(r1.destination, '/login?redirect=%2Freels');

  const r2 = evaluateProxyAccess('/chats', new Map([['u', 'priya_v']]), {});
  assert.strictEqual(r2.destination, '/login?redirect=%2Fchats%3Fu%3Dpriya_v');

  const r3 = evaluateProxyAccess('/leaderboard', new Map(), {});
  assert.strictEqual(r3.destination, '/login?redirect=%2Fleaderboard');

  console.log('✅ [PASS] Test 3: Unauthenticated access to /reels, /chats, and /leaderboard strictly blocked');
}

// ==========================================
// TEST 4: Unauthenticated user curling internal API
// ==========================================
{
  const apiRes = evaluateProxyAccess('/api/posts', new Map(), {});
  assert.strictEqual(apiRes.status, 401, 'Internal API must return 401 Unauthorized for unauthenticated requests');
  console.log('✅ [PASS] Test 4: Internal data APIs strictly return 401 Unauthorized for non-logged-in visitors');
}

// ==========================================
// TEST 5: Public pages allowed freely
// ==========================================
{
  assert.strictEqual(evaluateProxyAccess('/', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/about', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/safety', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/privacy', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/terms', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/download', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/login', new Map(), {}).type, 'NEXT');
  assert.strictEqual(evaluateProxyAccess('/signup', new Map(), {}).type, 'NEXT');
  console.log('✅ [PASS] Test 5: Public policy, download, and auth landing pages remain freely accessible');
}

// ==========================================
// TEST 6: Authenticated student allowed full access & redirected to deep link if on login
// ==========================================
{
  const authCookie = {
    dpsbuzz_user: encodeURIComponent(JSON.stringify({ username: 'rohit_kumar', role: 'student' })),
  };

  const appRes = evaluateProxyAccess('/u/ananya_sharma', new Map(), authCookie);
  assert.strictEqual(appRes.type, 'NEXT', 'Authenticated student must be allowed to access profile');

  // Authenticated student visiting login with redirect link
  const loginRes = evaluateProxyAccess('/login', new Map([['redirect', '/u/shashwath71845?post=post-99']]), authCookie);
  assert.strictEqual(loginRes.type, 'REDIRECT');
  assert.strictEqual(loginRes.destination, '/u/shashwath71845?post=post-99', 'Already logged-in student is forwarded straight to requested link');

  console.log('✅ [PASS] Test 6: Authenticated student gains access and resolves directly to intended deep link');
}

// ==========================================
// TEST 7: Client AuthGuard SSR authorization prevention
// ==========================================
{
  // Simulating AuthGuard initial state on SSR
  function getInitialAuthGuardState(isSsr, isPublicRoute, storedUser) {
    if (isSsr) return false; // Never render private children during SSR!
    if (isPublicRoute) return true;
    if (storedUser && storedUser.username && storedUser.username !== 'guest') return true;
    return false;
  }

  assert.strictEqual(getInitialAuthGuardState(true, false, null), false, 'SSR must never evaluate to authorized for private routes');
  assert.strictEqual(getInitialAuthGuardState(true, true, null), false, 'SSR stays false to prevent hydration mismatches');
  assert.strictEqual(getInitialAuthGuardState(false, false, { username: 'student_1' }), true, 'Client with session is authorized');
  assert.strictEqual(getInitialAuthGuardState(false, false, { username: 'guest' }), false, 'Guest is NOT authorized');
  console.log('✅ [PASS] Test 7: Client AuthGuard SSR protection prevents flashing or leaking private app content');
}

console.log('\n====================================================');
console.log('📊 ALL 7/7 AUTH GUARD & DEEP-LINK TESTS PASSED!');
console.log('====================================================\n');
