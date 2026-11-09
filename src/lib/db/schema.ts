// Tables that used to live in Supabase, now stored in Cloudflare D1 with an
// "sb_" prefix (so they don't clash with the older D1 tables of the same name).
// Shared by the D1 adapter (src/lib/db/d1Supabase.ts) and the copy script.

export const NOW_SQL = "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))";

export interface TableDef {
  /** Columns in Supabase order. The first entry is the primary key. */
  columns: string[];
  primaryKey: string;
  /** Extra unique constraints used by upsert(onConflict). */
  unique?: string[][];
  json?: string[];
  bool?: string[];
  /** Column that gets a "now" default. */
  createdAt?: string;
}

export const TABLES: Record<string, TableDef> = {
  app_settings: { columns: ['key', 'value', 'updated_at'], primaryKey: 'key', json: ['value'] },
  comments: {
    columns: ['id', 'post_id', 'username', 'user_avatar', 'text', 'image', 'created_at'],
    primaryKey: 'id',
    createdAt: 'created_at',
  },
  follow_requests: {
    columns: ['id', 'requester', 'target', 'status', 'created_at'],
    primaryKey: 'id',
    unique: [['requester', 'target']],
    createdAt: 'created_at',
  },
  follows: {
    columns: ['id', 'follower', 'following', 'created_at'],
    primaryKey: 'id',
    unique: [['follower', 'following']],
    createdAt: 'created_at',
  },
  groups: {
    columns: ['id', 'name', 'description', 'creator_username', 'member_count', 'created_at'],
    primaryKey: 'id',
    createdAt: 'created_at',
  },
  likes: {
    columns: ['id', 'post_id', 'username', 'created_at'],
    primaryKey: 'id',
    unique: [['post_id', 'username']],
    createdAt: 'created_at',
  },
  messages: {
    columns: [
      'id', 'client_id', 'chat_id', 'sender_id', 'text', 'created_at', 'status', 'delivered_at', 'read_at',
      'error_reason', 'message_type', 'post_id', 'post_preview',
    ],
    primaryKey: 'id',
    unique: [['client_id']],
    json: ['post_preview'],
    createdAt: 'created_at',
  },
  message_receipts: {
    columns: ['id', 'chat_id', 'client_id', 'user_id', 'delivered_at', 'read_at'],
    primaryKey: 'id',
    unique: [['chat_id', 'client_id', 'user_id']],
  },
  notifications: {
    columns: ['id', 'user_id', 'recipient_username', 'actor_username', 'type', 'title', 'body', 'link', 'is_read', 'created_at'],
    primaryKey: 'id',
    bool: ['is_read'],
    createdAt: 'created_at',
  },
  posts: {
    columns: [
      'id', 'user_id', 'username', 'full_name', 'user_avatar', 'class', 'caption', 'image_url', 'images', 'song',
      'habit_category', 'habit_tag', 'likes_count', 'comments_count', 'repost_count', 'is_repost', 'reposted_from',
      'is_pinned', 'is_hidden', 'created_at', 'updated_at',
    ],
    primaryKey: 'id',
    json: ['images', 'song', 'reposted_from'],
    bool: ['is_repost', 'is_pinned', 'is_hidden'],
    createdAt: 'created_at',
  },
  profiles: {
    columns: [
      'id', 'username', 'full_name', 'avatar_url', 'bio', 'class', 'section', 'role', 'is_verified', 'follower_count',
      'following_count', 'post_count', 'created_at', 'updated_at', 'is_approved', 'is_private', 'spirit_points',
    ],
    primaryKey: 'id',
    unique: [['username']],
    bool: ['is_verified', 'is_approved', 'is_private'],
    createdAt: 'created_at',
  },
  stories: {
    columns: ['id', 'user_id', 'username', 'media_url', 'caption', 'expires_at', 'created_at'],
    primaryKey: 'id',
    createdAt: 'created_at',
  },
};

export const tableName = (t: string) => `sb_${t}`;

export function createTableSql(t: string): string[] {
  const def = TABLES[t];
  const cols = def.columns.map((c) => {
    if (c === def.primaryKey) return `"${c}" TEXT PRIMARY KEY`;
    if (c === def.createdAt) return `"${c}" TEXT DEFAULT ${NOW_SQL}`;
    return `"${c}"`;
  });
  const out = [`CREATE TABLE IF NOT EXISTS ${tableName(t)} (${cols.join(', ')});`];
  for (const u of def.unique || []) {
    out.push(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_${tableName(t)}_${u.join('_')} ON ${tableName(t)} (${u.map((c) => `"${c}"`).join(', ')});`
    );
  }
  if (def.createdAt) {
    out.push(`CREATE INDEX IF NOT EXISTS ix_${tableName(t)}_${def.createdAt} ON ${tableName(t)} ("${def.createdAt}");`);
  }
  if (t === 'messages') out.push(`CREATE INDEX IF NOT EXISTS ix_sb_messages_chat ON sb_messages ("chat_id", "created_at");`);
  if (t === 'notifications') out.push(`CREATE INDEX IF NOT EXISTS ix_sb_notifications_user ON sb_notifications ("recipient_username");`);
  return out;
}
