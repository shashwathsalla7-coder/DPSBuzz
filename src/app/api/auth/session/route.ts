import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/** Returns who the server thinks is logged in (from the signed, httpOnly cookie). */
export async function GET(req: NextRequest) {
  const s = getSession(req);
  return NextResponse.json(
    s ? { authenticated: true, username: s.username, id: s.id, role: s.role } : { authenticated: false },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
