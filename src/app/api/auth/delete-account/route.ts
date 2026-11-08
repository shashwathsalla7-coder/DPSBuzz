import { NextRequest, NextResponse } from 'next/server';
import { deleteServerAccount } from '@/lib/serverStore';
import { canActAs, clearSessionCookie, getSession } from '@/lib/auth/session';
import { deleteCredential } from '@/lib/auth/credentials';
import { ADMIN_USERNAME, normalizeUsername } from '@/lib/auth/profileLookup';

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const username = normalizeUsername(body?.username || session.username);

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }
    if (!canActAs(session, username)) {
      return NextResponse.json({ success: false, error: 'You can only delete your own account.' }, { status: 403 });
    }
    if (username === ADMIN_USERNAME) {
      return NextResponse.json({ success: false, error: 'The administrator account cannot be deleted.' }, { status: 400 });
    }

    const updated = await deleteServerAccount(username);
    await deleteCredential(username).catch((e) => console.warn('[delete-account] credential cleanup failed:', e));

    const res = NextResponse.json({
      success: true,
      message: `Account @${username} and all content permanently deleted from server.`,
      remainingProfiles: updated.profiles.length,
    });
    if (session.username === username) clearSessionCookie(res);
    return res;
  } catch (error: any) {
    console.error('Error deleting server account:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
