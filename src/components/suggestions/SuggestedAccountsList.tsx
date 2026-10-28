'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DataStore, type InstagramSuggestionItem } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

interface SuggestedAccountsListProps {
  limit?: number;
  showHeader?: boolean;
  onFollowToggled?: (username: string, isNowFollowing: boolean) => void;
  className?: string;
}

export function SuggestedAccountsList({
  limit = 5,
  showHeader = true,
  onFollowToggled,
  className = '',
}: SuggestedAccountsListProps) {
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [suggestions, setSuggestions] = useState<InstagramSuggestionItem[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const refreshSuggestions = useCallback(() => {
    const user = DataStore.getCurrentUser();
    if (!user || !user.username) return;
    const cleanUser = user.username.toLowerCase().trim();
    setCurrentUsername(cleanUser);

    const items = DataStore.getInstagramSuggestions(cleanUser);
    setSuggestions(items);

    const follows = DataStore.getFollows();
    const map: Record<string, boolean> = {};
    follows
      .filter((f) => f.follower.toLowerCase() === cleanUser)
      .forEach((f) => {
        map[f.following.toLowerCase()] = true;
      });
    setFollowingMap(map);

    const requests = DataStore.getFollowRequests();
    const reqMap: Record<string, boolean> = {};
    requests
      .filter((r) => r.requester.toLowerCase() === cleanUser)
      .forEach((r) => {
        reqMap[r.target.toLowerCase()] = true;
      });
    setRequestedMap(reqMap);
  }, []);

  useEffect(() => {
    refreshSuggestions();

    // Pull fresh registered classmates from server/database so new users appear in suggestions
    fetch('/api/search')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.profiles)) {
          const current = DataStore.getProfiles();
          const map = new Map<string, any>();
          for (const p of current) {
            if (p && p.username) map.set(p.username.toLowerCase(), p);
          }
          let changed = false;
          for (const sp of data.profiles) {
            if (!sp || !sp.username) continue;
            const u = sp.username.toLowerCase();
            const existing = map.get(u);
            if (!existing) {
              map.set(u, sp);
              changed = true;
            } else if (
              existing.avatar !== sp.avatar ||
              existing.followerCount !== sp.followerCount ||
              existing.followingCount !== sp.followingCount ||
              existing.fullName !== sp.fullName ||
              existing.isVerified !== sp.isVerified
            ) {
              map.set(u, { ...existing, ...sp });
              changed = true;
            }
          }
          if (changed) {
            DataStore.saveProfiles(Array.from(map.values()));
            refreshSuggestions();
          }
        }
      })
      .catch(() => {});

    const handleUpdate = () => refreshSuggestions();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshSuggestions]);

  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const inflightTogglesRef = useRef<Record<string, boolean>>({});

  const handleToggle = (targetUsername: string) => {
    if (!currentUsername || !targetUsername) return;
    const cleanTar = targetUsername.toLowerCase().trim();
    if (inflightTogglesRef.current[cleanTar]) return;
    inflightTogglesRef.current[cleanTar] = true;

    const isNowFollowing = followingMap[cleanTar];
    const targetItem = suggestions.find((s) => s.profile.username.toLowerCase() === cleanTar);

    try {
      if (!isNowFollowing && targetItem?.profile.isPrivate) {
        const hasReq = DataStore.hasRequestedFollow(currentUsername, targetUsername);
        if (hasReq) {
          DataStore.cancelFollowRequest(currentUsername, targetUsername);
          setRequestedMap((prev) => ({ ...prev, [cleanTar]: false }));
        } else {
          DataStore.requestFollow(currentUsername, targetUsername);
          setRequestedMap((prev) => ({ ...prev, [cleanTar]: true }));
        }
        return;
      }

      const isNow = DataStore.toggleFollow(currentUsername, targetUsername);
      setFollowingMap((prev) => ({
        ...prev,
        [cleanTar]: isNow,
      }));
      if (onFollowToggled) {
        onFollowToggled(targetUsername, isNow);
      }
    } finally {
      setTimeout(() => {
        inflightTogglesRef.current[cleanTar] = false;
      }, 250);
    }
  };

  const visibleItems = useMemo(() => {
    // Filter out accounts that have already been followed so list stays fresh and clean
    return suggestions
      .filter((item) => !followingMap[item.profile.username.toLowerCase()])
      .slice(0, limit);
  }, [suggestions, followingMap, limit]);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 select-none ${className}`}>
      {/* Header matching Instagram */}
      {showHeader && (
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">
            Suggested for you
          </h3>
          <Link
            href="/search?chip=Accounts"
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            See all
          </Link>
        </div>
      )}

      {/* Suggested Profiles List */}
      <div className="space-y-3.5">
        {visibleItems.map((item) => {
          const person = item.profile;
          const isFollowing = !!followingMap[person.username.toLowerCase()];
          const pair = getAvatarColorPair(person.username);
          const initials = (person.fullName || person.username).slice(0, 2).toUpperCase();

          return (
            <div
              key={person.id || person.username}
              className="flex items-center justify-between gap-3 group"
            >
              {/* Profile Avatar & Info Link */}
              <Link
                href={`/u/${person.username}`}
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity"
              >
                {/* 44px Circular Avatar */}
                <div
                  className="w-11 h-11 rounded-full shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs border border-black/10 dark:border-white/10 shadow-2xs"
                  style={{ backgroundColor: pair.bg, color: pair.text }}
                >
                  {(person.avatar || DataStore.getProfileByUsername(person.username)?.avatar) ? (
                    <img
                      src={person.avatar || DataStore.getProfileByUsername(person.username)?.avatar || ''}
                      alt={person.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Identity & Mutuals / Suggested Line */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-[var(--text)] truncate leading-tight">
                    {person.fullName || person.username}
                  </p>

                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    {/* Overlapping Mutual Friend Avatars (if mutual friends exist) */}
                    {item.mutualFriends.length > 0 && (
                      <div className="flex items-center shrink-0">
                        {item.mutualFriends.map((mf, idx) => {
                          const mfPair = getAvatarColorPair(mf.username);
                          return (
                            <div
                              key={mf.username}
                              className={`w-3.5 h-3.5 rounded-full overflow-hidden border border-black dark:border-zinc-900 flex items-center justify-center text-[7px] font-bold ${
                                idx > 0 ? '-ml-1.5' : ''
                              }`}
                              style={{ backgroundColor: mfPair.bg, color: mfPair.text }}
                            >
                              {(mf.avatar || DataStore.getProfileByUsername(mf.username)?.avatar) ? (
                                <img
                                  src={mf.avatar || DataStore.getProfileByUsername(mf.username)?.avatar || ''}
                                  alt={mf.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                mf.username.slice(0, 1).toUpperCase()
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Subtitle: "Followed by X + N" or "Suggested for you" */}
                    <p className="text-[11.5px] text-[var(--text-muted)] truncate font-normal">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Follow Button (Instagram Blue Link Text) */}
              {(() => {
                const isRequested = !isFollowing && (requestedMap[person.username.toLowerCase()] || DataStore.hasRequestedFollow(currentUsername, person.username));
                return (
                  <button
                    type="button"
                    onClick={() => handleToggle(person.username)}
                    style={{ touchAction: 'manipulation' }}
                    className={`text-xs font-semibold px-2 py-1.5 shrink-0 transition-colors cursor-pointer touch-manipulation ${
                      isFollowing
                        ? 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        : isRequested
                        ? 'text-[var(--text-muted)] font-bold'
                        : 'text-[#0095F6] hover:text-[#1877F2] active:opacity-75'
                    }`}
                    aria-label={isFollowing ? `Unfollow ${person.username}` : `Follow ${person.username}`}
                  >
                    {isFollowing
                      ? 'Following'
                      : isRequested
                      ? 'Requested 🔒'
                      : currentUsername && DataStore.isFollowing(person.username, currentUsername)
                      ? 'Follow Back'
                      : 'Follow'}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SuggestedAccountsList;
