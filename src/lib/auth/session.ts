import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Signed session cookie (server-only authority for "who is calling").
// Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload))
// The old `dpsbuzz_user` cookie is only a UI hint and is never trusted.
// ============================================================================

export const SESSION_COOKIE = 'dpsbuzz_session';
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = 'student' | 'teacher' | 'admin';

export interface Session {
  username: string;
  id: string;
  role: SessionRole;
  iat: number;
  exp: number;
}

/** True when SESSION_SECRET is set on the server (needed to log anyone in). */
export function sessionConfigured(): boolean {
  return (process.env.SESSION_SECRET || '').length >= 32;
}

export const SESSION_NOT_CONFIGURED =
  'Login is not set up on the server yet: the SESSION_SECRET setting is missing. Ask the site admin to add it in the hosting settings.';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET env var is missing or shorter than 32 characters.');
  }
  return secret;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createSessionToken(input: { username: string; id: string; role: SessionRole }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Session = {
    username: input.username.toLowerCase().trim(),
    id: input.id,
    role: input.role,
    iat: now,
    exp: now + SESSION_TTL_SEC,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    if (!payload?.username || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!['student', 'teacher', 'admin'].includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): Session | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(res: NextResponse, input: { username: string; id: string; role: SessionRole }): void {
  res.cookies.set(SESSION_COOKIE, createSessionToken(input), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  });
  // Non-sensitive UI hint read by client code. NEVER trusted by the server.
  res.cookies.set(
    'dpsbuzz_user',
    encodeURIComponent(JSON.stringify({ id: input.id, username: input.username, role: input.role })),
    { secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SEC }
  );
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  res.cookies.set('dpsbuzz_user', '', { path: '/', maxAge: 0 });
  res.cookies.set('dpsbuzz_admin_session', '', { path: '/', maxAge: 0 });
}

export function isStaff(s: Session | null): boolean {
  return Boolean(s && (s.role === 'admin' || s.role === 'teacher'));
}

export function isAdmin(s: Session | null): boolean {
  return Boolean(s && s.role === 'admin');
}

/** True when the session user is `username` or an admin. */
export function canActAs(s: Session | null, username: unknown): boolean {
  if (!s) return false;
  if (s.role === 'admin') return true;
  return typeof username === 'string' && username.toLowerCase().trim().replace(/^@+/, '') === s.username;
}
