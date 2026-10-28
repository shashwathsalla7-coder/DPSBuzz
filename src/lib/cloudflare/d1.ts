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

export function isD1Configured(): boolean {
  return Boolean(
    CF_ACCOUNT_ID &&
    CF_DATABASE_ID &&
    CF_API_TOKEN &&
    !CF_ACCOUNT_ID.includes('your_') &&
    !CF_DATABASE_ID.includes('your_') &&
    !CF_API_TOKEN.includes('your_')
  );
}

/**
 * Executes a single SQL query against Cloudflare D1 via the REST API.
 */
export async function d1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!isD1Configured()) {
    return [];
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
      console.warn('[Cloudflare D1] Query failed:', res.status, errText);
      return [];
    }

    const data: D1ApiResponse<T> = await res.json();
    if (!data.success || !data.result?.[0]?.success) {
      console.warn('[Cloudflare D1] Query error:', data.errors);
      return [];
    }

    return data.result[0].results || [];
  } catch (err) {
    console.warn('[Cloudflare D1] Network/Execution error:', err);
    return [];
  }
}

/**
 * Executes an INSERT, UPDATE, or DELETE query against Cloudflare D1.
 */
export async function d1Execute(sql: string, params: any[] = []): Promise<boolean> {
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
