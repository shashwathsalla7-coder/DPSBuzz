import { NextRequest, NextResponse } from 'next/server';
import { getSession, isAdmin } from '@/lib/auth/session';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { deleteCredential, listBanned, setBanned, setPassword } from '@/lib/auth/credentials';
import { ADMIN_USERNAME, findStoredProfile, normalizeUsername } from '@/lib/auth/profileLookup';

// Admin-only account management: set/reset passwords, ban/unban.
export async function GET(req: NextRequest) {
  if (!isAdmin(getSession(req))) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  try {
    return NextResponse.json({ success: true, banned: await listBanned() });
  } catch {
    return NextResponse.json({ success: false, error: 'Credential database unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(getSession(req))) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '');
  const username = normalizeUsername(body?.username);
  if (!username || username === ADMIN_USERNAME) {
    return NextResponse.json({ success: false, error: 'A valid student/staff username is required.' }, { status: 400 });
  }
  if (!(await findStoredProfile(username))) {
    return NextResponse.json({ success: false, error: `No account @${username} exists.` }, { status: 404 });
  }

  try {
    switch (action) {
      case 'set_password': {
        const weak = validatePasswordStrength(body?.password);
        if (weak) return NextResponse.json({ success: false, error: weak }, { status: 400 });
        await setPassword(username, await hashPassword(body.password));
        return NextResponse.json({ success: true, message: `Password for @${username} has been set.` });
      }
      case 'clear_password': {
        // Lets the student set a new password on their next login (claim flow).
        await deleteCredential(username);
        return NextResponse.json({ success: true, message: `@${username} will choose a new password on next login.` });
      }
      case 'ban':
        await setBanned(username, true, typeof body?.reason === 'string' ? body.reason.slice(0, 300) : undefined);
        return NextResponse.json({ success: true, message: `@${username} is banned.` });
      case 'unban':
        await setBanned(username, false);
        return NextResponse.json({ success: true, message: `@${username} is unbanned.` });
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[admin/users] error:', err);
    return NextResponse.json({ success: false, error: 'Credential database unavailable' }, { status: 503 });
  }
}
