import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, sessionConfigured, SESSION_NOT_CONFIGURED } from '@/lib/auth/session';
import { hashPassword, verifyPassword, safeEqual, validatePasswordStrength } from '@/lib/auth/password';
import { claimPassword, credentialsAvailable, getCredential } from '@/lib/auth/credentials';
import { ADMIN_USERNAME, findStoredProfile, normalizeUsername, roleOf } from '@/lib/auth/profileLookup';
import { checkRateLimit, getClientIp } from '@/lib/security';

const GENERIC_FAIL = 'Incorrect username or password.';

export async function POST(req: NextRequest) {
  if (!sessionConfigured()) {
    return NextResponse.json({ success: false, error: SESSION_NOT_CONFIGURED }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
  }

  // Brute-force protection: per account and per IP.
  const ip = getClientIp(req);
  const perUser = checkRateLimit(`login:u:${username}`, 10, 15 * 60 * 1000);
  const perIp = checkRateLimit(`login:ip:${ip}`, 1000, 15 * 60 * 1000) // high: a whole school shares one IP;
  if (!perUser.allowed || !perIp.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  // ---- Super admin: password comes ONLY from the ADMIN_PASSWORD env var ----
  if (username === ADMIN_USERNAME) {
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Admin login is disabled: ADMIN_PASSWORD is not configured on the server.' },
        { status: 503 }
      );
    }
    if (!safeEqual(password, adminPassword)) {
      return NextResponse.json({ success: false, error: GENERIC_FAIL }, { status: 401 });
    }
    const adminProfile = (await findStoredProfile(ADMIN_USERNAME)) || {
      id: 'admin-shashwath-id',
      username: ADMIN_USERNAME,
      fullName: 'Administrator',
      role: 'admin',
    };
    const res = NextResponse.json({ success: true, profile: { ...adminProfile, role: 'admin' } });
    setSessionCookie(res, { username: ADMIN_USERNAME, id: adminProfile.id, role: 'admin' });
    return res;
  }

  if (!credentialsAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Login is temporarily unavailable (credential database not configured).' },
      { status: 503 }
    );
  }

  const profile = await findStoredProfile(username);
  if (!profile) {
    return NextResponse.json({ success: false, error: GENERIC_FAIL }, { status: 401 });
  }
  const canonical = normalizeUsername(profile.username);
  const role = roleOf(profile);

  let cred;
  try {
    cred = await getCredential(canonical);
  } catch (err) {
    console.error('[auth/login] credential lookup failed:', err);
    return NextResponse.json({ success: false, error: 'Login is temporarily unavailable. Please try again.' }, { status: 503 });
  }

  if (cred?.banned) {
    return NextResponse.json(
      { success: false, error: cred.ban_reason || 'This account has been suspended by school administration.' },
      { status: 403 }
    );
  }

  let claimed = false;
  if (cred?.password_hash) {
    const ok = await verifyPassword(password, cred.password_hash);
    if (!ok) return NextResponse.json({ success: false, error: GENERIC_FAIL }, { status: 401 });
  } else {
    // Legacy account with no password yet: first login sets it ("claim").
    // Staff/admin accounts can't be claimed — an admin must set their password.
    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'This staff account has no password yet. Ask the administrator to set one.' },
        { status: 403 }
      );
    }
    const weak = validatePasswordStrength(password);
    if (weak) {
      return NextResponse.json(
        { success: false, error: `First login: please choose a new password for your account. ${weak}` },
        { status: 400 }
      );
    }
    try {
      claimed = await claimPassword(canonical, await hashPassword(password));
    } catch (err) {
      console.error('[auth/login] claim failed:', err);
      return NextResponse.json({ success: false, error: 'Login is temporarily unavailable. Please try again.' }, { status: 503 });
    }
    if (!claimed) {
      // Someone set a password a moment ago — fall back to normal verification.
      const again = await getCredential(canonical).catch(() => null);
      if (!again?.password_hash || !(await verifyPassword(password, again.password_hash))) {
        return NextResponse.json({ success: false, error: GENERIC_FAIL }, { status: 401 });
      }
    }
  }

  const res = NextResponse.json({ success: true, profile, passwordJustSet: claimed });
  setSessionCookie(res, { username: canonical, id: profile.id, role });
  return res;
}
