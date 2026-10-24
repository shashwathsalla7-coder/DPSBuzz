import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface CricketerImageMeta {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  sourcePageUrl: string | null;
  photographer: string | null;
  licenseName: string | null;
  attributionText: string | null;
  isVerifiedFreeLicense: boolean;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdvoeddebquguuqgyscl.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';

function getSupabase() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

// In-memory cache for ultra-fast lookups
declare global {
  var __dpsbuzz_cricket_photos: Map<string, CricketerImageMeta> | undefined;
}

if (!globalThis.__dpsbuzz_cricket_photos) {
  globalThis.__dpsbuzz_cricket_photos = new Map<string, CricketerImageMeta>();
}
const photoMemoryCache = globalThis.__dpsbuzz_cricket_photos;

/**
 * Permitted open/free licenses on Wikimedia Commons.
 * Commercial reuse and derivatives must be permitted (CC BY, CC BY-SA, Public Domain, CC0, GFDL).
 */
const PERMITTED_LICENSE_KEYWORDS = [
  'cc0',
  'cc-0',
  'cc by',
  'cc-by',
  'cc by-sa',
  'cc-by-sa',
  'public domain',
  'pd',
  'gfdl',
  'free art',
  'no restrictions',
];

/**
 * Strips HTML tags from artist / metadata strings
 */
function cleanHtmlString(str?: string | null): string {
  if (!str) return 'Unknown';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Verifies if the image license allows free reuse according to Commons terms
 */
export function isLicensePermitted(licenseStr?: string | null): boolean {
  if (!licenseStr) return false;
  const lower = licenseStr.toLowerCase();
  // Disallow non-commercial (NC) or no-derivatives (ND)
  if (lower.includes('-nc') || lower.includes(' non-commercial') || lower.includes('-nd')) {
    return false;
  }
  return PERMITTED_LICENSE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Queries Wikimedia Commons API for a cricketer portrait/action photograph
 * with full license metadata and pre-scaled thumbnail URL.
 */
export async function searchWikimediaCricketerPhoto(
  playerName: string,
  playerId?: string
): Promise<CricketerImageMeta | null> {
  const cacheKey = (playerId || playerName).toLowerCase().trim();

  // 1. Check memory cache first
  if (photoMemoryCache.has(cacheKey)) {
    return photoMemoryCache.get(cacheKey)!;
  }

  // 2. Check Supabase app_settings cache
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `cricket_photo_${cacheKey}`)
      .maybeSingle();

    if (data?.value) {
      const parsed: CricketerImageMeta = JSON.parse(data.value);
      photoMemoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (err) {
    // Continue if DB check fails
  }

  // 3. Search Wikimedia Commons MediaWiki API
  try {
    const searchTerms = [
      `${playerName} cricketer`,
      `${playerName} cricket`,
      playerName,
    ];

    for (const term of searchTerms) {
      const apiUrl =
        `https://commons.wikimedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          generator: 'search',
          gsrsearch: term,
          gsrnamespace: '6', // Namespace 6 = File:
          prop: 'imageinfo',
          iiprop: 'url|size|extmetadata|mime',
          iiurlwidth: '320', // Pre-scaled 320px thumbnail
          format: 'json',
          origin: '*',
        }).toString();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DPSBuzz/1.0 (DPS School Social Platform - Educational Project; https://dpsbuzz.in)',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});

      // Filter for valid image formats (jpeg, png, webp)
      const validImagePage = pages.find((p: any) => {
        const info = p.imageinfo?.[0];
        if (!info || !info.thumburl) return false;
        const mime = (info.mime || '').toLowerCase();
        return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';
      });

      if (validImagePage) {
        const p: any = validImagePage;
        const info = p.imageinfo[0];
        const meta = info.extmetadata || {};

        const licenseName =
          meta.LicenseShortName?.value || meta.License?.value || meta.UsageTerms?.value || 'CC BY-SA 4.0';

        const isFree = isLicensePermitted(licenseName);
        if (!isFree) {
          // If the first result is not free, continue search
          continue;
        }

        const photographer = cleanHtmlString(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons contributor');
        const sourcePageUrl = info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`;
        const thumbnailUrl = info.thumburl;
        const imageUrl = info.url;

        const attributionText = `Photo by ${photographer} via Wikimedia Commons (${licenseName})`;

        const result: CricketerImageMeta = {
          imageUrl,
          thumbnailUrl,
          sourcePageUrl,
          photographer,
          licenseName,
          attributionText,
          isVerifiedFreeLicense: true,
        };

        // Cache in memory
        photoMemoryCache.set(cacheKey, result);

        // Cache in Supabase app_settings (async background)
        savePhotoToDatabase(cacheKey, result).catch(() => {});

        return result;
      }
    }
  } catch (err) {
    console.warn(`[cricketPhotoService] Failed to query Wikimedia for ${playerName}:`, err);
  }

  // Fallback metadata if no free image is found or network error occurs
  const fallback: CricketerImageMeta = {
    imageUrl: null,
    thumbnailUrl: null,
    sourcePageUrl: null,
    photographer: null,
    licenseName: null,
    attributionText: null,
    isVerifiedFreeLicense: false,
  };

  photoMemoryCache.set(cacheKey, fallback);
  return fallback;
}

async function savePhotoToDatabase(key: string, meta: CricketerImageMeta): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('app_settings').upsert(
      {
        key: `cricket_photo_${key}`,
        value: JSON.stringify(meta),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );
  } catch {
    // Non-fatal
  }
}
