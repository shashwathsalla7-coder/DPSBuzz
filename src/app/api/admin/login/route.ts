import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth/session';
import { safeEqual } from '@/lib/auth/password';
import { ADMIN_USERNAME, findStoredProfile } from '@/lib/auth/profileLookup';
import { checkRateLimit, getClientIp } from '@/lib/security';

// Admin password comes ONLY from the ADMIN_PASSWORD environment variable.
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json().catch(() => ({ password: '' }));
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const ip = getClientIp(req);
    if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000).allowed) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || '';
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Admin login is disabled: ADMIN_PASSWORD is not configured on the server.' },
        { status: 503 }
      );
    }
    if (!safeEqual(password.trim(), adminPassword)) {
      return NextResponse.json({ success: false, error: 'Incorrect administrator password.' }, { status: 401 });
    }

    const stored = await findStoredProfile(ADMIN_USERNAME).catch(() => null);
    const adminUser = {
      ...(stored || {}),
      id: stored?.id || 'admin-shashwath-id',
      username: ADMIN_USERNAME,
      fullName: stored?.fullName || 'Administrator',
      role: 'admin',
      avatar: stored?.avatar || null,
      isVerified: true,
      isApproved: true,
      class: 'Staff',
      section: 'Admin',
    };

    const res = NextResponse.json({ success: true, user: adminUser });
    setSessionCookie(res, { username: ADMIN_USERNAME, id: adminUser.id, role: 'admin' });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Admin authentication failed' }, { status: 500 });
  }
}
