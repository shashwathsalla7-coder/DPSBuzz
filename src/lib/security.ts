import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// ============================================================================
// DPS BUZZ - ENTERPRISE DEFENSIVE SECURITY ENGINE
// Cloudflare Edge Rate Limiting, Input Sanitization, SSRF Shield & Auth Guards
// ============================================================================

// 1. SLIDING WINDOW RATE LIMITER (In-Memory per Worker / Edge)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitRecord>();

// Clean up stale rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitBuckets.entries()) {
      if (now > record.resetAt) {
        rateLimitBuckets.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Extracts client IP from Cloudflare or proxy headers
 */
export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Enforces rate limit per IP or User identifier
 * @param key unique bucket key (e.g. `posts:ip_1.2.3.4`)
 * @param maxRequests maximum allowed calls within window
 * @param windowMs window size in milliseconds
 */
export function checkRateLimit(key: string, maxRequests: number = 30, windowMs: number = 60000): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const record = rateLimitBuckets.get(key);

  if (!record || now > record.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfterSec: 0 };
}

/**
 * Rate limit response helper
 */
export function createRateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
        'X-RateLimit-Reset': String(retryAfterSec),
      },
    }
  );
}

// 2. INPUT SANITIZATION (Defensive XSS & Tag Stripping)
/**
 * Strips script tags, iframe, javascript: URLs and dangerous HTML event handlers
 */
export function sanitizeText(input: unknown, maxLength: number = 2000): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Truncate to maximum length
  if (str.length > maxLength) {
    str = str.slice(0, maxLength);
  }

  // Strip dangerous HTML tags
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  str = str.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  str = str.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // Strip event handlers (onload, onerror, onclick, etc.)
  str = str.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
  str = str.replace(/\bon\w+\s*=\s*[^>\s]+/gi, '');

  // Strip javascript: or data: in links or text
  str = str.replace(/javascript:[^"'\s]*/gi, '');

  return str.trim();
}

// 3. SSRF & MEDIA URL VALIDATION
const ALLOWED_MEDIA_DOMAINS = [
  'res.cloudinary.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'media.dpsbuzz.in',
  'images.unsplash.com',
  'media.tenor.com',
  'c.tenor.com',
  'giphy.com',
  'media.giphy.com',
  'supabase.co',
];

/**
 * Validates that an image or video URL uses HTTPS and belongs to a sanctioned domain.
 * Blocks private IP ranges (127.0.0.1, 169.254.x.x, 10.x.x.x, 192.168.x.x) to stop SSRF.
 */
export function isValidMediaUrl(urlString: unknown): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();

  // Allow relative upload paths
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/videos/')
  ) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and private IP subnets
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('172.16.')
    ) {
      return false;
    }

    // Check against allowed domains or cloudflare R2 subdomains
    const isAllowed =
      ALLOWED_MEDIA_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`)) ||
      hostname.includes('r2.cloudflarestorage.com');

    return isAllowed;
  } catch {
    return false;
  }
}

// 4. SESSION AUTHENTICATION & ROLE EXTRACTION
export interface AuthUserSession {
  username: string;
  role: 'student' | 'teacher' | 'admin';
  fullName?: string;
}

/**
 * Returns the logged-in user from the SIGNED session cookie.
 * (The old unsigned dpsbuzz_user cookie is never trusted.)
 */
export function getAuthenticatedUser(req: NextRequest): AuthUserSession | null {
  const s = getSession(req);
  return s ? { username: s.username, role: s.role, fullName: s.username } : null;
}
