import { gzipSync } from 'zlib';
import { v2 as cloudinary } from 'cloudinary';
import { d1QueryStrict } from '@/lib/cloudflare/d1';

// ============================================================================
// Nightly database backup: every D1 table → one gzipped JSON file stored as a
// PRIVATE raw asset in Cloudinary (dpsbuzz/backups/d1-YYYY-MM-DD.json.gz).
// Keeps the most recent KEEP_DAYS files. No extra account needed.
// ============================================================================

const KEEP_DAYS = 14;
const FOLDER = 'dpsbuzz/backups';

function configure(): boolean {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || '';
  const api_key = process.env.CLOUDINARY_API_KEY || '';
  const api_secret = process.env.CLOUDINARY_API_SECRET || '';
  if (!cloud_name || !api_key || !api_secret) return false;
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  return true;
}

/** Reads every user table in D1 (paged), returning { table: rows[] }. */
export async function exportD1(): Promise<Record<string, unknown[]>> {
  const tables = await d1QueryStrict<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations' ORDER BY name;"
  );
  const out: Record<string, unknown[]> = {};
  const readTable = async (name: string) => {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      const page = await d1QueryStrict(`SELECT * FROM "${name.replace(/"/g, '')}" LIMIT 1000 OFFSET ${offset};`);
      rows.push(...page);
      if (page.length < 1000) break;
    }
    out[name] = rows;
  };
  // Read 8 tables at a time to stay well inside the function time limit.
  const names = tables.map((t) => t.name);
  for (let i = 0; i < names.length; i += 8) {
    await Promise.all(names.slice(i, i + 8).map(readTable));
  }
  return out;
}

export interface BackupResult {
  file: string;
  tables: number;
  rows: number;
  bytes: number;
  deletedOld: string[];
}

export async function runDatabaseBackup(): Promise<BackupResult> {
  if (!configure()) throw new Error('Cloudinary is not configured');
  const data = await exportD1();
  const rows = Object.values(data).reduce((n, r) => n + r.length, 0);
  const payload = gzipSync(
    Buffer.from(JSON.stringify({ createdAt: new Date().toISOString(), source: 'cloudflare-d1', tables: data }))
  );
  const day = new Date().toISOString().slice(0, 10);
  const publicId = `${FOLDER}/d1-${day}.json.gz`;

  await new Promise<void>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', type: 'private', public_id: publicId, overwrite: true, invalidate: true },
      (err) => (err ? reject(err) : resolve())
    );
    stream.end(payload);
  });

  // Retention: delete backups older than KEEP_DAYS.
  const deletedOld: string[] = [];
  try {
    const list = await cloudinary.api.resources({ resource_type: 'raw', type: 'private', prefix: `${FOLDER}/d1-`, max_results: 100 });
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    const old = (list.resources as Array<{ public_id: string; created_at: string }>)
      .filter((r) => new Date(r.created_at).getTime() < cutoff)
      .map((r) => r.public_id);
    if (old.length) {
      await cloudinary.api.delete_resources(old, { resource_type: 'raw', type: 'private' });
      deletedOld.push(...old);
    }
  } catch (err) {
    console.warn('[backup] retention cleanup skipped:', err);
  }

  return { file: publicId, tables: Object.keys(data).length, rows, bytes: payload.length, deletedOld };
}

/** Signed, short-lived download link for a backup file (admins only). */
export function backupDownloadUrl(publicId: string): string | null {
  if (!configure()) return null;
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: 'raw',
    type: 'private',
    expires_at: Math.floor(Date.now() / 1000) + 600,
  });
}
