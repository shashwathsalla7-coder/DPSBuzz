'use client';

import { useEffect } from 'react';

const CURRENT_DATA_VERSION = '2026_10_31_v1';
const PRESERVED_KEYS = new Set(['dpsbuzz_user', 'dpsbuzz_admin_session', 'dpsbuzz_theme']);

/**
 * Ensures legacy localhost cache, stale IndexedDB records, and deprecated
 * service worker caches are purged once on first load of this release,
 * preventing students and admin from viewing ghost or outdated accounts.
 */
export default function DataVersionGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const activeVersion = localStorage.getItem('dpsbuzz_data_version');
      if (activeVersion !== CURRENT_DATA_VERSION) {
        // 1. Purge legacy localhost keys
        const legacyPrefixes = [
          'dpsbuzz_posts_v1',
          'dpsbuzz_posts_v2',
          'dpsbuzz_profiles_v1',
          'dpsbuzz_chat_conversations_v1',
          'dpsbuzz_chat_conversations_v2',
          'dpsbuzz_chat_messages_v1',
          'dpsbuzz_chat_messages_v2',
          'dpsbuzz_stories_v1',
          'dpsbuzz_stories_v2',
          'dpsbuzz_highlights_v1',
          'dpsbuzz_calendar_v1',
          'dpsbuzz_cached_sync',
        ];

        for (const key of legacyPrefixes) {
          localStorage.removeItem(key);
        }

        // Clean out any orphaned recipient test chat keys
        const allKeys = Object.keys(localStorage);
        for (const k of allKeys) {
          if (
            k.startsWith('dpsbuzz_chat_messages_test') ||
            k.startsWith('dpsbuzz_chat_conversations_test') ||
            k.startsWith('dpsbuzz_chat_messages_dummy')
          ) {
            localStorage.removeItem(k);
          }
        }

        // 2. Clear old Service Worker caches
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((name) => {
              caches.delete(name).catch(() => {});
            });
          }).catch(() => {});
        }

        // 3. Clean legacy IndexedDB if present
        if ('indexedDB' in window && typeof window.indexedDB.databases === 'function') {
          window.indexedDB.databases().then((dbs) => {
            for (const db of dbs) {
              if (db.name && (db.name.includes('dpsbuzz_local') || db.name.includes('test_db'))) {
                window.indexedDB.deleteDatabase(db.name);
              }
            }
          }).catch(() => {});
        }

        // Set current active data version
        localStorage.setItem('dpsbuzz_data_version', CURRENT_DATA_VERSION);
      }
    } catch {}
  }, []);

  return null;
}
