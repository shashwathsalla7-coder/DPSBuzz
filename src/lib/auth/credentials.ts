import { d1QueryStrict, isD1Configured } from '@/lib/cloudflare/d1';

// ============================================================================
// Password + ban storage. Lives in its own D1 table so it is NEVER returned by
// profile queries (`SELECT * FROM profiles`) and never copied into serverStore.
// ============================================================================

export interface CredentialRow {
  username: string;
  password_hash: string | null;
  banned: number;
  ban_reason: string | null;
  updated_at: string;
}

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await d1QueryStrict(
    `CREATE TABLE IF NOT EXISTS auth_credentials (
       username TEXT PRIMARY KEY,
       password_hash TEXT,
       banned INTEGER DEFAULT 0,
       ban_reason TEXT,
       updated_at TEXT DEFAULT CURRENT_TIMESTAMP
     );`
  );
  tableReady = true;
}

export function credentialsAvailable(): boolean {
  return isD1Configured();
}

function clean(username: string): string {
  return username.toLowerCase().trim().replace(/^@+/, '');
}

/** Throws on DB error so "error" is never mistaken for "no password set". */
export async function getCredential(username: string): Promise<CredentialRow | null> {
  await ensureTable();
  const rows = await d1QueryStrict<CredentialRow>(
    'SELECT username, password_hash, banned, ban_reason, updated_at FROM auth_credentials WHERE username = ? LIMIT 1;',
    [clean(username)]
  );
  return rows[0] || null;
}

/**
 * Sets the password only if none is set yet (atomic "claim").
 * Returns true if this call set it.
 */
export async function claimPassword(username: string, passwordHash: string): Promise<boolean> {
  await ensureTable();
  const u = clean(username);
  await d1QueryStrict(
    `INSERT INTO auth_credentials (username, password_hash, banned, updated_at)
     VALUES (?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP
     WHERE auth_credentials.password_hash IS NULL;`,
    [u, passwordHash]
  );
  const row = await getCredential(u);
  return Boolean(row && row.password_hash === passwordHash);
}

/** Admin reset / user password change: always overwrites. */
export async function setPassword(username: string, passwordHash: string): Promise<void> {
  await ensureTable();
  await d1QueryStrict(
    `INSERT INTO auth_credentials (username, password_hash, banned, updated_at)
     VALUES (?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, updated_at = CURRENT_TIMESTAMP;`,
    [clean(username), passwordHash]
  );
}

export async function setBanned(username: string, banned: boolean, reason?: string): Promise<void> {
  await ensureTable();
  await d1QueryStrict(
    `INSERT INTO auth_credentials (username, password_hash, banned, ban_reason, updated_at)
     VALUES (?, NULL, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(username) DO UPDATE SET banned = excluded.banned, ban_reason = excluded.ban_reason, updated_at = CURRENT_TIMESTAMP;`,
    [clean(username), banned ? 1 : 0, banned ? reason || 'Account suspended by school administration.' : null]
  );
}

export async function listBanned(): Promise<Array<{ username: string; ban_reason: string | null }>> {
  await ensureTable();
  return d1QueryStrict('SELECT username, ban_reason FROM auth_credentials WHERE banned = 1;');
}

export async function deleteCredential(username: string): Promise<void> {
  await ensureTable();
  await d1QueryStrict('DELETE FROM auth_credentials WHERE username = ?;', [clean(username)]);
}
