import { randomUUID } from 'crypto';
import { d1QueryStrict } from '@/lib/cloudflare/d1';
import { TABLES, createTableSql, tableName } from './schema';

// ============================================================================
// Drop-in replacement for the parts of the Supabase JS client this app used,
// running on Cloudflare D1 (sb_* tables). Supabase is no longer used.
//
// Supports: from(t).select(cols?, {count, head}) / insert / upsert(onConflict,
// ignoreDuplicates) / update / delete, filters eq neq in is like ilike gt gte
// lt lte match or("a.eq.x,b.ilike.%y%"), order, limit, single, maybeSingle,
// .select() after writes (RETURNING), rpc('increment_spirit_points').
// Results have Supabase's shape: { data, error, count }.
// ============================================================================

type Row = Record<string, unknown>;
type Result = { data: any; error: { message: string; code?: string } | null; count?: number | null };

const ensured = new Set<string>();
async function ensureTable(t: string): Promise<void> {
  if (ensured.has(t)) return;
  for (const sql of createTableSql(t)) await d1QueryStrict(sql);
  ensured.add(t);
}

const q = (c: string) => `"${c.replace(/"/g, '')}"`;

function encodeValue(t: string, col: string, v: unknown): unknown {
  const def = TABLES[t];
  if (v === undefined) return null;
  if (v === null) return null;
  if (def?.json?.includes(col)) return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function decodeRow(t: string, r: Row): Row {
  const def = TABLES[t];
  if (!def) return r;
  const out: Row = { ...r };
  for (const c of def.json || []) {
    if (typeof out[c] === 'string') {
      try {
        out[c] = JSON.parse(out[c] as string);
      } catch {
        // leave as text
      }
    }
  }
  for (const c of def.bool || []) if (c in out && out[c] !== null) out[c] = Boolean(out[c]);
  return out;
}

function filterValue(v: unknown): unknown {
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}

class Query implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private cols = '*';
  private countMode = false;
  private head = false;
  private where: string[] = [];
  private params: unknown[] = [];
  private orderBy: string[] = [];
  private limitN: number | null = null;
  private offsetN: number | null = null;
  private singleMode: 'one' | 'maybe' | null = null;
  private rows: Row[] = [];
  private patch: Row = {};
  private onConflict: string[] | null = null;
  private ignoreDuplicates = false;
  private returning = false;

  constructor(private t: string) {}

  // ---- operations ----
  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    if (this.op === 'select') {
      this.cols = cols;
      this.countMode = Boolean(opts?.count);
      this.head = Boolean(opts?.head);
    } else {
      this.returning = true;
    }
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = 'insert';
    this.rows = Array.isArray(values) ? values : [values];
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = 'upsert';
    this.rows = Array.isArray(values) ? values : [values];
    this.onConflict = opts?.onConflict ? opts.onConflict.split(',').map((s) => s.trim()) : null;
    this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates);
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.patch = values;
    return this;
  }
  delete(opts?: { count?: string }) {
    this.op = 'delete';
    this.countMode = Boolean(opts?.count);
    return this;
  }

  // ---- filters ----
  private add(sql: string, ...p: unknown[]) {
    this.where.push(sql);
    this.params.push(...p);
    return this;
  }
  eq(c: string, v: unknown) {
    return v === null ? this.add(`${q(c)} IS NULL`) : this.add(`${q(c)} = ?`, filterValue(v));
  }
  neq(c: string, v: unknown) {
    return v === null ? this.add(`${q(c)} IS NOT NULL`) : this.add(`(${q(c)} IS NULL OR ${q(c)} != ?)`, filterValue(v));
  }
  gt(c: string, v: unknown) { return this.add(`${q(c)} > ?`, filterValue(v)); }
  gte(c: string, v: unknown) { return this.add(`${q(c)} >= ?`, filterValue(v)); }
  lt(c: string, v: unknown) { return this.add(`${q(c)} < ?`, filterValue(v)); }
  lte(c: string, v: unknown) { return this.add(`${q(c)} <= ?`, filterValue(v)); }
  like(c: string, v: string) { return this.add(`${q(c)} LIKE ? ESCAPE '\\'`, v); }
  ilike(c: string, v: string) { return this.add(`${q(c)} LIKE ? ESCAPE '\\' COLLATE NOCASE`, v); }
  in(c: string, vals: unknown[]) {
    if (!vals.length) return this.add('0');
    return this.add(`${q(c)} IN (${vals.map(() => '?').join(', ')})`, ...vals.map(filterValue));
  }
  is(c: string, v: null | boolean) {
    if (v === null) return this.add(`${q(c)} IS NULL`);
    return this.add(`${q(c)} = ?`, v ? 1 : 0);
  }
  match(obj: Row) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v);
    return this;
  }
  /** PostgREST "or" string, e.g. "a.eq.x,b.ilike.%y%". */
  or(expr: string) {
    const parts: string[] = [];
    const p: unknown[] = [];
    for (const term of expr.split(',')) {
      const m = /^([a-zA-Z0-9_]+)\.(eq|neq|ilike|like|gt|gte|lt|lte|is)\.(.*)$/.exec(term.trim());
      if (!m) continue;
      const [, col, op, raw] = m;
      const val = raw.replace(/\*/g, '%');
      const sqlOp = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' }[op as 'eq'];
      if (op === 'is') parts.push(`${q(col)} IS NULL`);
      else if (op === 'ilike') { parts.push(`${q(col)} LIKE ? COLLATE NOCASE`); p.push(val); }
      else if (op === 'like') { parts.push(`${q(col)} LIKE ?`); p.push(val); }
      else { parts.push(`${q(col)} ${sqlOp} ?`); p.push(val); }
    }
    if (parts.length) this.add(`(${parts.join(' OR ')})`, ...p);
    return this;
  }
  order(c: string, opts?: { ascending?: boolean }) {
    this.orderBy.push(`${q(c)} ${opts?.ascending === false ? 'DESC' : 'ASC'}`);
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number) {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }
  maybeSingle() {
    this.singleMode = 'maybe';
    this.limitN = 1;
    return this;
  }
  single() {
    this.singleMode = 'one';
    this.limitN = 1;
    return this;
  }

  then<A = Result, B = never>(onOk?: ((v: Result) => A | PromiseLike<A>) | null, onErr?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return this.run().then(onOk, onErr);
  }

  private whereSql() {
    return this.where.length ? ` WHERE ${this.where.join(' AND ')}` : '';
  }

  private async run(): Promise<Result> {
    const t = this.t;
    if (!TABLES[t]) return { data: null, error: { message: `Unknown table ${t}`, code: '42P01' } };
    const table = tableName(t);
    try {
      await ensureTable(t);
      const known = new Set(TABLES[t].columns);

      if (this.op === 'select') {
        if (this.countMode && this.head) {
          const r = await d1QueryStrict<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}${this.whereSql()};`, this.params);
          return { data: null, error: null, count: Number(r[0]?.n || 0) };
        }
        const cols = this.cols.trim() === '*' ? '*' : this.cols.split(',').map((c) => q(c.trim())).join(', ');
        let sql = `SELECT ${cols} FROM ${table}${this.whereSql()}`;
        if (this.orderBy.length) sql += ` ORDER BY ${this.orderBy.join(', ')}`;
        if (this.limitN !== null) sql += ` LIMIT ${Math.max(0, Math.floor(this.limitN))}`;
        if (this.offsetN !== null) sql += ` OFFSET ${Math.max(0, Math.floor(this.offsetN))}`;
        const rows = (await d1QueryStrict<Row>(sql + ';', this.params)).map((r) => decodeRow(t, r));
        let count: number | null = null;
        if (this.countMode) {
          const c = await d1QueryStrict<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}${this.whereSql()};`, this.params);
          count = Number(c[0]?.n || 0);
        }
        if (this.singleMode) {
          if (!rows[0] && this.singleMode === 'one') return { data: null, error: { message: 'No rows', code: 'PGRST116' } };
          return { data: rows[0] || null, error: null, count };
        }
        return { data: rows, error: null, count };
      }

      if (this.op === 'insert' || this.op === 'upsert') {
        const def = TABLES[t];
        const out: Row[] = [];
        for (const raw of this.rows) {
          const row: Row = { ...raw };
          if (def.primaryKey === 'id' && (row.id === undefined || row.id === null || row.id === '')) row.id = randomUUID();
          const cols = Object.keys(row).filter((c) => known.has(c));
          const vals = cols.map((c) => encodeValue(t, c, row[c]));
          let sql = `INSERT INTO ${table} (${cols.map(q).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
          if (this.op === 'upsert') {
            const target = this.onConflict || [def.primaryKey];
            const sets = cols.filter((c) => !target.includes(c) && c !== def.primaryKey).map((c) => `${q(c)} = excluded.${q(c)}`);
            sql +=
              this.ignoreDuplicates || sets.length === 0
                ? ` ON CONFLICT(${target.map(q).join(', ')}) DO NOTHING`
                : ` ON CONFLICT(${target.map(q).join(', ')}) DO UPDATE SET ${sets.join(', ')}`;
          }
          sql += this.returning ? ' RETURNING *;' : ';';
          const r = await d1QueryStrict<Row>(sql, vals);
          if (this.returning) out.push(...r.map((x) => decodeRow(t, x)));
        }
        return { data: this.returning ? out : null, error: null };
      }

      if (this.op === 'update') {
        const cols = Object.keys(this.patch).filter((c) => known.has(c));
        if (!cols.length) return { data: null, error: null };
        const sets = cols.map((c) => `${q(c)} = ?`).join(', ');
        const vals = cols.map((c) => encodeValue(t, c, this.patch[c]));
        const r = await d1QueryStrict<Row>(
          `UPDATE ${table} SET ${sets}${this.whereSql()}${this.returning ? ' RETURNING *' : ''};`,
          [...vals, ...this.params]
        );
        return { data: this.returning ? r.map((x) => decodeRow(t, x)) : null, error: null };
      }

      // delete
      const r = await d1QueryStrict<Row>(`DELETE FROM ${table}${this.whereSql()} RETURNING ${q(TABLES[t].primaryKey)};`, this.params);
      return { data: this.returning ? r : null, error: null, count: this.countMode ? r.length : null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { data: null, error: { message, code: /UNIQUE constraint/i.test(message) ? '23505' : 'D1' } };
    }
  }
}

/** Minimal realtime stand-in: the app polls instead, so channels do nothing. */
function noopChannel() {
  const ch: any = {
    on: () => ch,
    subscribe: (cb?: (s: string) => void) => {
      try {
        cb?.('CLOSED');
      } catch {}
      return ch;
    },
    send: async () => 'ok',
    unsubscribe: async () => 'ok',
  };
  return ch;
}

export function createClient(..._args: unknown[]) {
  return {
    from(table: string) {
      return new Query(table);
    },
    async rpc(name: string, args: Record<string, unknown> = {}): Promise<Result> {
      if (name === 'increment_spirit_points') {
        try {
          await ensureTable('profiles');
          await d1QueryStrict(
            'UPDATE sb_profiles SET spirit_points = COALESCE(spirit_points, 0) + ? WHERE username = ?;',
            [Number(args.pts) || 0, String(args.u_name || '')]
          );
          return { data: null, error: null };
        } catch (err) {
          return { data: null, error: { message: String(err) } };
        }
      }
      return { data: null, error: null };
    },
    channel: () => noopChannel(),
    removeChannel: () => undefined,
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  };
}

export type D1SupabaseClient = ReturnType<typeof createClient>;
