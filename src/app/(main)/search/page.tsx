'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  History,
  Users,
  Hash,
  Megaphone,
  UserCheck,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { DataStore, type Profile, type Post, type Group, type Notice } from '@/lib/dataStore';
import { HeroCard } from '@/components/search/HeroCard';
import { TrendingGrid } from '@/components/search/TrendingGrid';
import { SearchSkeletons } from '@/components/search/SearchSkeletons';
import { getAvatarColorPair } from '@/config/tokens';

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeletons />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<'Top' | 'People' | 'Groups' | 'Hashtags' | 'Notices'>('Top');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Demo state for screenshot testing (?state=loading | ?state=error)
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'error'>('normal');

  // App data state
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [follows, setFollows] = useState<Array<{ follower: string; following: string }>>([]);
  const [registeredUserCount, setRegisteredUserCount] = useState<number>(0);

  // Recent searches with localStorage persistence
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpsbuzz_recent_searches_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stateParam = params.get('state');
      if (stateParam === 'loading') setDemoState('loading');
      else if (stateParam === 'error') setDemoState('error');

      const qParam = params.get('q');
      if (qParam) setQuery(qParam);

      const chipParam = params.get('chip');
      if (chipParam && ['Top', 'People', 'Groups', 'Hashtags', 'Notices'].includes(chipParam)) {
        setActiveChip(chipParam as any);
      }
    }

    const loadData = () => {
      setCurrentUser(DataStore.getCurrentUser());
      setAllProfiles(DataStore.getProfiles());
      setPosts(DataStore.getPosts());
      setGroups(DataStore.getGroups());
      setNotices(DataStore.getNotices());
      setFollows(DataStore.getFollows());
      setRegisteredUserCount(DataStore.getRegisteredUserCount());
    };

    loadData();
    window.addEventListener('dpsbuzz:content_updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('dpsbuzz:content_updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const isFollowing = (targetUsername: string) => {
    if (!currentUser) return false;
    return follows.some(
      (f) =>
        f.follower.toLowerCase() === currentUser.username.toLowerCase() &&
        f.following.toLowerCase() === targetUsername.toLowerCase()
    );
  };

  const handleFollowToggle = (targetUsername: string) => {
    if (!currentUser) return;
    if (currentUser.username.toLowerCase().trim() === targetUsername.toLowerCase().trim()) {
      showToast('You cannot follow yourself! 🙅');
      return;
    }
    const isNow = DataStore.toggleFollow(currentUser.username, targetUsername);
    setFollows(DataStore.getFollows());
    showToast(isNow ? `Following @${targetUsername}` : `Unfollowed @${targetUsername}`);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('dpsbuzz_recent_searches_v1');
    } catch {}
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
  };

  // 1. Star of the Week winner (Hero card)
  const starWinner = useMemo(() => {
    if (allProfiles.length === 0) return [];
    const sorted = [...allProfiles].sort(
      (a, b) => (b.followerCount || 0) - (a.followerCount || 0)
    );
    return sorted.slice(0, 2).map((p) => ({
      profile: p,
      badgeTitle: 'Top Rank Student',
    }));
  }, [allProfiles]);

  // 2. Trending posts (highest likes/comments)
  const trendingPosts = useMemo(() => {
    return [...posts]
      .filter((p) => Boolean(p.imageUrl || (p.images && p.images.length > 0)))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
  }, [posts]);

  // 3. Suggested accounts: Always feature official Admin @shashwath71845 at the top for new users!
  const suggestedClassmates = useMemo(() => {
    if (!currentUser) return [];
    const isShashwath = currentUser.username.toLowerCase() === 'shashwath71845';

    if (isShashwath) {
      // For Shashwath: Show all registered students across the entire school so Shashwath knows everyone
      return allProfiles.filter((p) => p.username.toLowerCase() !== 'shashwath71845');
    }

    // For new students: Strictly find classmates, but ALWAYS suggest @shashwath71845 as the #1 top suggested account
    const classmates = allProfiles.filter(
      (p) =>
        p.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        p.username.toLowerCase() !== 'shashwath71845' &&
        p.class === currentUser.class &&
        (p.section || 'A') === (currentUser.section || 'A')
    );

    const shashwathProfile = allProfiles.find((p) => p.username.toLowerCase() === 'shashwath71845') || {
      id: 'admin-shashwath-id',
      username: 'shashwath71845',
      fullName: 'Shashwath (Admin)',
      bio: 'DPS Buzz Super Administrator 🛡️',
      avatar: null,
      role: 'admin',
      isVerified: true,
      class: '8',
      section: 'G',
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    } as Profile;

    return [shashwathProfile, ...classmates];
  }, [allProfiles, currentUser]);

  // 4. Live Search Filter Logic
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q && activeChip === 'Top') return null;

    // Filter people
    const matchedPeople = allProfiles.filter((p) => {
      const matchText =
        !q ||
        p.username.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q);
      const matchClass = selectedClass === 'All' || p.class === selectedClass;
      const matchSection = selectedSection === 'All' || (p.section || 'A') === selectedSection;
      return matchText && matchClass && matchSection;
    });

    // Filter groups
    const matchedGroups = groups.filter((g) =>
      !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
    );

    // Filter hashtags from posts
    const allHashtags = new Set<string>();
    posts.forEach((p) => {
      const tags = p.caption?.match(/#[a-zA-Z0-9_]+/g) || [];
      tags.forEach((t) => allHashtags.add(t));
    });
    const matchedHashtags = Array.from(allHashtags).filter((t) =>
      !q || t.toLowerCase().includes(q)
    );

    // Filter notices
    const matchedNotices = notices.filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q)
    );

    return {
      people: matchedPeople,
      groups: matchedGroups,
      hashtags: matchedHashtags,
      notices: matchedNotices,
      totalCount:
        matchedPeople.length +
        matchedGroups.length +
        matchedHashtags.length +
        matchedNotices.length,
    };
  }, [query, activeChip, allProfiles, groups, posts, notices, selectedClass, selectedSection]);

  const chipTabs = ['Top', 'People', 'Groups', 'Hashtags', 'Notices'] as const;

  return (
    <div className="space-y-0 min-h-dvh max-w-[480px] mx-auto select-none">
      {/* 1. Search Field 48px (sunken, pill radius) with search icon and filter icon button */}
      <div
        className="px-4 pb-2 sticky top-0 z-30 bg-[var(--surface)] border-b transition-all"
        style={{
          borderColor: 'var(--line)',
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        }}
      >
        <div
          className="w-full h-12 rounded-full flex items-center px-4 gap-3 border transition-all"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <SearchIcon size={19} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search people, groups, hashtags"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] font-medium h-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
              selectedClass !== 'All' || selectedSection !== 'All'
                ? 'text-[var(--primary)] bg-[var(--primary-tint)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            aria-label="Filter class and section"
            title="Class filters"
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* 2. Filter Chips (pill, 36px, horizontal scroll): Top, People, Groups, Hashtags, Notices */}
      <div className="px-4 py-1.5 flex gap-2 overflow-x-auto no-scrollbar sticky top-[60px] z-20 bg-[var(--surface)] border-b border-[var(--line)]">
        {chipTabs.map((chip) => {
          const isSelected = activeChip === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className="h-9 px-4.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none"
              style={{
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-sunken)',
                color: isSelected ? 'var(--on-primary)' : 'var(--text-muted)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--line)',
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Live Community Enrolled Count Banner */}
      <div className="px-4 pt-3 pb-1">
        <div
          className="w-full px-3.5 py-2.5 rounded-[18px] border flex items-center justify-between transition-all shadow-xs"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white gradient-bg shrink-0 shadow-xs">
              🐝
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <span>{registeredUserCount} {registeredUserCount === 1 ? 'Student' : 'Students'} Enrolled</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                DPS Dilsukhnagar real student community
              </p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--surface)] transition-colors border shrink-0"
            style={{ borderColor: 'var(--line)' }}
          >
            Star Board →
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {demoState === 'loading' ? (
        <SearchSkeletons />
      ) : demoState === 'error' ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--danger)]/10 text-[var(--danger)]">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-bold text-sm text-[var(--text)]">Couldn&apos;t load search results</h3>
          <p className="text-xs text-[var(--text-muted)]">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => setDemoState('normal')}
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[var(--primary)] inline-flex items-center gap-1.5"
          >
            <RotateCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      ) : (!query && activeChip === 'Top') ? (
        /* DEFAULT STATE: Recent searches (if any) + Star of Week Hero Card + Trending Grid + Classmates */
        <div className="space-y-4">
          {/* Recent searches row */}
          {recentSearches.length > 0 && (
            <div className="px-4 pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  <History size={13} />
                  <span>Recent searches</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearRecent}
                  className="text-xs text-[var(--text-muted)] hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectRecent(term)}
                    className="px-3 py-1 rounded-full text-xs font-medium border bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-[var(--text)] cursor-pointer"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Hero Card: Star of the Week (top student on Star Board) */}
          <HeroCard
            winners={starWinner}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
            currentUsername={currentUser?.username}
          />

          {/* 4. "Trending this week" (2-col 4:5 grid with bottom scrim) + "Suggested from your class" */}
          <TrendingGrid
            trendingPosts={trendingPosts}
            suggestedClassmates={suggestedClassmates}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
            currentUsername={currentUser?.username}
            onPostClick={(p) => setQuery(p.username)}
          />
        </div>
      ) : (
        /* LIVE RESULTS STATE (Grouped by active chip) */
        <div className="px-4 py-4 space-y-4">
          {searchResults && searchResults.totalCount === 0 ? (
            activeChip === 'Groups' ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl">
                  👥
                </div>
                <p className="text-sm font-bold text-[var(--text)]">
                  {query ? `No groups found matching "${query}"` : 'No student groups created yet'}
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  {query
                    ? 'Try searching with a different keyword or create a new student group.'
                    : 'Be the first to start a study group, house squad, or project club!'}
                </p>
                <Link
                  href="/groups"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
                >
                  <Users size={14} />
                  <span>+ Create a Group</span>
                </Link>
              </div>
            ) : activeChip === 'Notices' ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-amber-500/10 text-amber-500 text-xl">
                  📢
                </div>
                <p className="text-sm font-bold text-[var(--text)]">
                  {query ? `No notices matching "${query}"` : 'No official school notices posted yet'}
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  Official circulars, exam schedules, and admin announcements will appear here once published.
                </p>
              </div>
            ) : (
              /* No Results state: "Nobody called that. Check the spelling." */
              <div className="py-16 text-center space-y-2">
                <p className="text-sm font-bold text-[var(--text)]">
                  Nobody called that. Check the spelling.
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Try searching for a classmate&apos;s name, section, or school club.
                </p>
              </div>
            )
          ) : (
            <>
              {/* People Results */}
              {(activeChip === 'Top' || activeChip === 'People') && searchResults && searchResults.people.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Users size={14} />
                    <span>People ({searchResults.people.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.people.map((person) => {
                      const following = isFollowing(person.username);
                      const pair = getAvatarColorPair(person.username);
                      return (
                        <div
                          key={person.id}
                          className="p-3 rounded-[16px] border flex items-center justify-between gap-3 bg-[var(--surface)]"
                          style={{ borderColor: 'var(--line)' }}
                        >
                          <Link
                            href={`/u/${person.username}`}
                            className="flex items-center gap-3 min-w-0"
                          >
                            <div
                              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ backgroundColor: pair.bg, color: pair.text }}
                            >
                              {person.fullName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[var(--text)] truncate">
                                {person.fullName}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                @{person.username} · Class {person.class}-{person.section || 'A'}
                              </p>
                            </div>
                          </Link>

                          {currentUser?.username.toLowerCase().trim() !== person.username.toLowerCase().trim() && (
                            <button
                              type="button"
                              onClick={() => handleFollowToggle(person.username)}
                              className="px-4 py-1.5 rounded-full text-xs font-bold btn-press shrink-0 cursor-pointer"
                              style={{
                                backgroundColor: following ? 'var(--surface-sunken)' : 'var(--primary)',
                                color: following ? 'var(--text)' : 'var(--on-primary)',
                                border: following ? '1px solid var(--line)' : 'none',
                              }}
                            >
                              {following ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Groups Results */}
              {(activeChip === 'Top' || activeChip === 'Groups') && searchResults && searchResults.groups.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Users size={14} />
                    <span>Groups ({searchResults.groups.length})</span>
                  </div>
                  <div className="space-y-2">
                    {searchResults.groups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3 rounded-[16px] border flex items-center justify-between gap-3 bg-[var(--surface)]"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Group avatar: 14px radius rounded square */}
                          <div
                            className="w-11 h-11 rounded-[14px] flex items-center justify-center font-bold text-xs shrink-0 text-white"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text)] truncate">
                              {group.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {(group as any).membersCount || group.memberCount || (group.members?.length || 1)} members · {group.category}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => showToast(`Requested to join ${group.name}`)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold btn-press shrink-0 cursor-pointer"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--on-primary)',
                          }}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtag Results */}
              {(activeChip === 'Top' || activeChip === 'Hashtags') && searchResults && searchResults.hashtags.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Hash size={14} />
                    <span>Hashtags ({searchResults.hashtags.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {searchResults.hashtags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setQuery(tag)}
                        className="p-3 rounded-[14px] border flex items-center justify-between text-left bg-[var(--surface)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <span className="text-xs font-bold text-[var(--primary)]">{tag}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Post tag</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notices Results */}
              {(activeChip === 'Top' || activeChip === 'Notices') && searchResults && searchResults.notices.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Megaphone size={14} />
                    <span>Notices ({searchResults.notices.length})</span>
                  </div>
                  <div className="space-y-2.5">
                    {searchResults.notices.map((notice) => (
                      <div
                        key={notice.id}
                        onClick={() => setSelectedNotice(notice)}
                        className="p-3.5 rounded-[18px] border block bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-all cursor-pointer shadow-2xs"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-[var(--primary)] text-white shadow-2xs">
                            {notice.category}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{notice.date}</span>
                        </div>
                        <p className="text-xs font-bold text-[var(--text)]">{notice.title}</p>
                        {notice.content && (
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                            {notice.content}
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--primary)] font-semibold">
                          <span>Read full notice</span>
                          <span>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Class & Section Filter Bottom Sheet (24px top radius) */}
      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center select-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsFilterSheetOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-[24px] border p-5 shadow-2xl z-10 space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="font-bold text-sm text-[var(--text)]">Filter by Class & Section</h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Class Row */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text)]">Class</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['All', '6', '7', '8', '9', '10'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border"
                    style={{
                      backgroundColor: selectedClass === cls ? 'var(--primary)' : 'var(--surface-sunken)',
                      color: selectedClass === cls ? 'var(--on-primary)' : 'var(--text-muted)',
                      borderColor: selectedClass === cls ? 'transparent' : 'var(--line)',
                    }}
                  >
                    {cls === 'All' ? 'All Classes' : `Class ${cls}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Row */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text)]">Section</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {['All', 'A', 'B', 'C', 'D'].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSelectedSection(sec)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border"
                    style={{
                      backgroundColor: selectedSection === sec ? 'var(--primary)' : 'var(--surface-sunken)',
                      color: selectedSection === sec ? 'var(--on-primary)' : 'var(--text-muted)',
                      borderColor: selectedSection === sec ? 'transparent' : 'var(--line)',
                    }}
                  >
                    {sec === 'All' ? 'All Sections' : `Sec ${sec}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('All');
                  setSelectedSection('All');
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold border text-[var(--text)] hover:bg-[var(--surface-sunken)]"
                style={{ borderColor: 'var(--line)' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Reading Modal (28px radius) */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="relative w-full max-w-md rounded-t-[28px] sm:rounded-[28px] border p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto sm:hidden" />
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold uppercase shadow-2xs">
                {selectedNotice.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                aria-label="Close notice"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h2 className="text-base font-bold text-[var(--text)] leading-snug">
                {selectedNotice.title}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 tabular-nums">
                Official School Circular · {selectedNotice.date}
              </p>
            </div>

            <div className="p-3.5 rounded-[18px] bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] leading-relaxed whitespace-pre-line">
              {selectedNotice.content || (selectedNotice as any).body || 'All students and staff must note the above instructions carefully.'}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  DataStore.markNoticeAsRead(selectedNotice.id);
                  setSelectedNotice(null);
                  showToast('Notice marked as read! ✓');
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Mark as Read
              </button>
              <Link
                href={`/notices/${selectedNotice.id}`}
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-[var(--text)] bg-[var(--surface-sunken)] border border-[var(--line)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center cursor-pointer"
              >
                Open Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMessage && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg animate-fade-in pointer-events-none select-none"
          style={{ backgroundColor: 'var(--text)' }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
