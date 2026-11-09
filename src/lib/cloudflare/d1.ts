// ============================================================================
// DPS BUZZ - Cloudflare D1 Serverless Database Client
// 5 GB free persistent SQL storage (SQLite on Cloudflare Edge) - NEVER PAUSES
// ============================================================================

export interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta?: {
    duration?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

export interface D1ApiResponse<T = any> {
  result: D1QueryResult<T>[];
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
const CF_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_D1_TOKEN || '';

let d1AuthFailed = false;

export function isD1Configured(): boolean {
  if (d1AuthFailed) return false;
  return Boolean(
    CF_ACCOUNT_ID &&
    CF_DATABASE_ID &&
    CF_API_TOKEN &&
    !CF_ACCOUNT_ID.includes('your_') &&
    !CF_DATABASE_ID.includes('your_') &&
    !CF_API_TOKEN.includes('your_')
  );
}

// ---------------------------------------------------------------------------
// Short read cache. Every D1 call is an HTTPS round trip to Cloudflare
// (~0.2-0.5s), and many students poll the same data. Identical SELECTs within
// READ_TTL_MS share one result; any write clears the whole cache. Concurrent
// identical reads share one in-flight request.
// ---------------------------------------------------------------------------
const READ_TTL_MS = 4000;
const readCache = new Map<string, { at: number; promise: Promise<unknown[]> }>();

function isPureRead(sql: string): boolean {
  return /^\s*(SELECT|WITH)\b/i.test(sql) && !/\bRETURNING\b/i.test(sql);
}

export function clearD1ReadCache(): void {
  readCache.clear();
}

async function d1Fetch<T>(sql: string, params: any[]): Promise<T[]> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
    cache: 'no-store',
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) d1AuthFailed = true;
    throw new Error(`D1 query failed with HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data: D1ApiResponse<T> = await res.json();
  if (!data.success || !data.result?.[0]?.success) {
    throw new Error(`D1 query error: ${JSON.stringify(data.errors || [])}`);
  }
  return data.result[0].results || [];
}

async function d1Run<T>(sql: string, params: any[]): Promise<T[]> {
  if (!isPureRead(sql)) {
    readCache.clear();
    try {
      return await d1Fetch<T>(sql, params);
    } finally {
      readCache.clear();
    }
  }
  const key = `${sql}\u0000${JSON.stringify(params)}`;
  const hit = readCache.get(key);
  if (hit && Date.now() - hit.at < READ_TTL_MS) {
    const rows = (await hit.promise) as T[];
    return rows.map((r) => (r && typeof r === 'object' ? { ...(r as object) } : r)) as T[];
  }
  const promise = d1Fetch<T>(sql, params);
  readCache.set(key, { at: Date.now(), promise: promise as Promise<unknown[]> });
  promise.catch(() => readCache.delete(key));
  if (readCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of readCache) if (now - v.at >= READ_TTL_MS) readCache.delete(k);
  }
  const rows = await promise;
  return rows.map((r) => (r && typeof r === 'object' ? { ...(r as object) } : r)) as T[];
}

/**
 * Executes a single SQL query against Cloudflare D1 via the REST API.
 * Returns [] on any error (use d1QueryStrict when an error must not look like "no rows").
 */
export async function d1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!isD1Configured()) return [];
  try {
    return await d1Run<T>(sql, params);
  } catch (err) {
    console.warn('[Cloudflare D1] Query error:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Like d1Query, but THROWS on any failure instead of returning [].
 * Use for security-sensitive reads where "error" must never look like "no rows".
 */
export async function d1QueryStrict<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!isD1Configured()) {
    throw new Error('Cloudflare D1 is not configured');
  }
  return d1Run<T>(sql, params);
}

/**
 * Executes an INSERT, UPDATE, or DELETE query against Cloudflare D1.
 */
export async function d1Execute(sql: string, params: any[] = []): Promise<boolean> {
  readCache.clear();
  if (!isD1Configured()) {
    return false;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql,
        params,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Cloudflare D1] Execute failed:', res.status, errText);
      if (res.status === 401 || res.status === 403) {
        d1AuthFailed = true;
      }
      return false;
    }

    const data: D1ApiResponse = await res.json();
    return Boolean(data.success && data.result?.[0]?.success);
  } catch (err) {
    console.warn('[Cloudflare D1] Execute error:', err);
    return false;
  }
}

/**
 * Executes a batch of SQL statements sequentially in Cloudflare D1.
 */
export async function d1Batch(statements: Array<{ sql: string; params?: any[] }>): Promise<boolean> {
  readCache.clear();
  if (!isD1Configured() || statements.length === 0) {
    return false;
  }

  // Cloudflare D1 supports batching multiple statements
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        statements.map((st) => ({
          sql: st.sql,
          params: st.params || [],
        }))
      ),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Cloudflare D1] Batch failed:', res.status, errText);
      return false;
    }

    const data: D1ApiResponse = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.warn('[Cloudflare D1] Batch error:', err);
    return false;
  }
}
