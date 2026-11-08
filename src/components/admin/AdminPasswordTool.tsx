'use client';

import { useState } from 'react';

/** Admin-only: set a student's password, or let them choose a new one at next login. */
export default function AdminPasswordTool() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: 'set_password' | 'clear_password') => {
    setMsg(null);
    if (!username.trim()) {
      setMsg({ ok: false, text: 'Enter a username.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg({ ok: Boolean(data.success), text: data.message || data.error || 'Request failed' });
      if (data.success) setPassword('');
    } catch {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] p-4 space-y-3">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">Account passwords</h2>
        <p className="text-xs text-[var(--text-muted)]">
          If someone set a student&apos;s password before they did, give the student a new password here, or reset it so
          the student chooses one at their next login.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="username"
          aria-label="Student username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-9 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none"
        />
        <input
          type="text"
          placeholder="new password (min 6)"
          aria-label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-9 px-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => run('set_password')}
          className="h-9 px-3 text-xs font-semibold text-white bg-[var(--primary)] disabled:opacity-50"
        >
          Set password
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run('clear_password')}
          className="h-9 px-3 text-xs font-semibold border border-[var(--line)] text-[var(--text)] disabled:opacity-50"
        >
          Reset (student chooses)
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>}
    </div>
  );
}
