import { d1QueryStrict, isD1Configured } from '@/lib/cloudflare/d1';

// ============================================================================
// Durable storage for the server store, one D1 row per collection.
//
// Why: on Vercel the filesystem is read-only and every server instance has its
// own memory, so the old JSON file reset to the git snapshot on every cold
// start (notices, notes, groups, comments... appeared and then vanished).
//
// Local `next dev` uses a separate "dev:" key prefix so it never overwrites
// production rows.
// ============================================================================

const PREFIX = process.env.NODE_ENV === 'production' ? '' : 'dev:';
const VERSION_KEY = `${PREFIX}__version`;

let tableReady = false;

export function kvEnabled(): boolean {
  return isD1Configured() && process.env.SERVER_STORE_KV !== '0';
}

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await d1QueryStrict(
    'CREATE TABLE IF NOT EXISTS server_kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);'
  );
  tableReady = true;
}

/** Version stamp of the last write (one-row read), or null if nothing stored yet. */
export async function kvVersion(): Promise<number | null> {
  await ensureTable();
  const rows = await d1QueryStrict<{ value: string }>('SELECT value FROM server_kv WHERE key = ? LIMIT 1;', [VERSION_KEY]);
  return rows[0] ? Number(rows[0].value) : null;
}

/** All collections as an object, or null if nothing stored yet. */
export async function kvLoadAll(): Promise<Record<string, unknown> | null> {
  await ensureTable();
  const rows = await d1QueryStrict<{ key: string; value: string }>(
    'SELECT key, value FROM server_kv WHERE key LIKE ?;',
    [`${PREFIX}%`]
  );
  const out: Record<string, unknown> = {};
  let found = false;
  for (const r of rows) {
    const k = r.key.slice(PREFIX.length);
    if (!k || k === '__version' || (PREFIX === '' && r.key.startsWith('dev:'))) continue;
    try {
      out[k] = JSON.parse(r.value);
      found = true;
    } catch {
      // skip corrupt row
    }
  }
  return found ? out : null;
}

/** Upserts the given collections and bumps the version. Returns the new version. */
export async function kvSave(partial: Record<string, unknown>): Promise<number> {
  await ensureTable();
  const version = Date.now();
  const entries = Object.entries(partial).filter(([k, v]) => k !== 'lastUpdated' && v !== undefined);
  entries.push(['__version', version]);
  // D1 allows up to 100 bound parameters per statement (3 per row).
  for (let i = 0; i < entries.length; i += 30) {
    const chunk = entries.slice(i, i + 30);
    const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
    const params: unknown[] = [];
    for (const [k, v] of chunk) {
      params.push(`${PREFIX}${k}`, k === '__version' ? String(v) : JSON.stringify(v), version);
    }
    await d1QueryStrict(
      `INSERT INTO server_kv (key, value, updated_at) VALUES ${placeholders}
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      params
    );
  }
  return version;
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}
