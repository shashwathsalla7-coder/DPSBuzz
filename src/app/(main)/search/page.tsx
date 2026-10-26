'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  History,
  Users,
  AlertCircle,
  RotateCw,
  Heart,
  Image as ImageIcon,
  Flame,
} from 'lucide-react';
import { DataStore, type Profile, type Post, type Notice } from '@/lib/dataStore';
import { HeroCard } from '@/components/search/HeroCard';
import { TrendingGrid } from '@/components/search/TrendingGrid';
import { SearchSkeletons } from '@/components/search/SearchSkeletons';
import { getAvatarColorPair } from '@/config/tokens';
import { SuggestedAccountsList } from '@/components/suggestions';

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeletons />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<'Accounts' | 'Posts'>('Accounts');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Demo state for testing (?state=loading | ?state=error)
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'error'>('normal');

  // App data state
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => (typeof window !== 'undefined' ? DataStore.getCurrentUser() : null));
  const [allProfiles, setAllProfiles] = useState<Profile[]>(() => (typeof window !== 'undefined' ? DataStore.getProfiles() : []));
  const [posts, setPosts] = useState<Post[]>(() => (typeof window !== 'undefined' ? DataStore.getPosts() : []));
  const [follows, setFollows] = useState<Array<{ follower: string; following: string }>>(() => (typeof window !== 'undefined' ? DataStore.getFollows() : []));
  const [followRequests, setFollowRequests] = useState<Array<{ requester: string; target: string }>>(() => (typeof window !== 'undefined' ? DataStore.getFollowRequests() : []));
  const [registeredUserCount, setRegisteredUserCount] = useState<number>(() => (typeof window !== 'undefined' ? DataStore.getRegisteredUserCount() : 0));

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
      if (chipParam && (chipParam.toLowerCase() === 'posts' || chipParam.toLowerCase() === 'post')) {
        setActiveChip('Posts');
      } else if (chipParam && (chipParam.toLowerCase() === 'accounts' || chipParam.toLowerCase() === 'people')) {
        setActiveChip('Accounts');
      }
    }

    const loadData = () => {
      setCurrentUser(DataStore.getCurrentUser());
      setAllProfiles([...DataStore.getProfiles()]);
      setPosts([...DataStore.getPosts()]);
      setFollows([...DataStore.getFollows()]);
      setFollowRequests([...DataStore.getFollowRequests()]);
      setRegisteredUserCount(DataStore.getRegisteredUserCount());
    };

    loadData();

    // Pull accounts and content from persistent cloud store on mount and periodically
    DataStore.syncWithServer().then(() => loadData()).catch(() => {});
    // Smart periodic sync every 30s when visible
    const syncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      DataStore.syncWithServer().then(() => loadData()).catch(() => {});
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        DataStore.syncWithServer().then(() => loadData()).catch(() => {});
      }
    };

    window.addEventListener('dpsbuzz:content_updated', loadData);
    window.addEventListener('storage', loadData);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('dpsbuzz:content_updated', loadData);
      window.removeEventListener('storage', loadData);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Live Database & Server Search Hook: Guarantees brand new users appear immediately
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&class=${selectedClass}&section=${selectedSection}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.profiles)) {
            setAllProfiles((prev) => {
              const map = new Map<string, Profile>();
              for (const p of prev) {
                if (p && p.username) map.set(p.username.toLowerCase(), p);
              }
              for (const sp of data.profiles) {
                if (!sp || !sp.username) continue;
                const u = sp.username.toLowerCase();
                if (!map.has(u)) {
                  map.set(u, sp);
                } else {
                  map.set(u, { ...map.get(u)!, ...sp });
                }
              }
              const merged = Array.from(map.values());
              DataStore.saveProfiles(merged);
              return merged;
            });
          }
        }
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedClass, selectedSection]);

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

    // If target has sent an incoming friend request to me, confirm it!
    if (DataStore.hasRequestedFollow(targetUsername, currentUser.username)) {
      DataStore.acceptFollowRequest(currentUser.username, targetUsername);
      setFollows([...DataStore.getFollows()]);
      setFollowRequests([...DataStore.getFollowRequests()]);
      showToast(`Accepted friend request from @${targetUsername}! 🎉`);
      return;
    }

    const isCurrentlyFollowing = isFollowing(targetUsername);
    if (!isCurrentlyFollowing) {
      const targetProf =
        allProfiles.find((p) => p.username.toLowerCase() === targetUsername.toLowerCase()) ||
        DataStore.getProfileByUsername(targetUsername);
      if (targetProf && targetProf.isPrivate) {
        const hasReq = DataStore.hasRequestedFollow(currentUser.username, targetUsername);
        if (hasReq) {
          DataStore.cancelFollowRequest(currentUser.username, targetUsername);
          showToast(`Cancelled follow request to @${targetUsername}`);
        } else {
          DataStore.requestFollow(currentUser.username, targetUsername);
          showToast(`Follow request sent to @${targetUsername} 🔒`);
        }
        setFollows([...DataStore.getFollows()]);
        setFollowRequests([...DataStore.getFollowRequests()]);
        return;
      }
    }
    const isNow = DataStore.toggleFollow(currentUser.username, targetUsername);
    setFollows([...DataStore.getFollows()]);
    setFollowRequests([...DataStore.getFollowRequests()]);
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

  // 1. Star Board & Leaderboard Top Rankers (Hero Card Carousel)
  const starWinner = useMemo(() => {
    if (allProfiles.length === 0) return [];
    const streaks = DataStore.getHabitStreaks();
    const streakMap = new Map(streaks.map((s) => [s.username.toLowerCase(), s]));
    const sorted = [...allProfiles].sort((a, b) => {
      const sA = streakMap.get(a.username.toLowerCase())?.habitPoints ?? ((a.spiritPoints || 0) + (a.followerCount || 0));
      const sB = streakMap.get(b.username.toLowerCase())?.habitPoints ?? ((b.spiritPoints || 0) + (b.followerCount || 0));
      return sB - sA;
    });
    return sorted.slice(0, 5).map((p, idx) => ({
      profile: p,
      badgeTitle: idx === 0 ? 'Star of the Week' : `Star Board Rank #${idx + 1}`,
    }));
  }, [allProfiles]);

  // 2. Trending posts (highest likes/comments from public accounts or followed accounts)
  const trendingPosts = useMemo(() => {
    const profileMap = new Map(allProfiles.map((p) => [p.username.toLowerCase(), p]));
    const myUser = currentUser?.username?.toLowerCase().trim() || '';

    return [...posts]
      .filter((p) => {
        if (!p || !p.username) return false;
        const author = p.username.toLowerCase().trim();
        if (author !== myUser) {
          const authorProf = profileMap.get(author);
          if (authorProf?.isPrivate && !isFollowing(author)) {
            return false; // Private posts only showed to their followers
          }
        }
        return Boolean(p.imageUrl || (p.images && p.images.length > 0));
      })
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
  }, [posts, allProfiles, currentUser, follows]);

  // 3. Suggested accounts: Always feature official Admin @shashwath71845 and classmates
  const suggestedClassmates = useMemo(() => {
    if (!currentUser) return [];
    const isShashwath = currentUser.username.toLowerCase() === 'shashwath71845';

    if (isShashwath) {
      return allProfiles.filter((p) => p.username.toLowerCase() !== 'shashwath71845');
    }

    const classmates = allProfiles.filter(
      (p) =>
        p.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        p.username.toLowerCase() !== 'shashwath71845' &&
        p.class === currentUser.class &&
        (p.section || 'A') === (currentUser.section || 'A')
    );

    const otherStudents = allProfiles.filter(
      (p) =>
        p.username.toLowerCase() !== currentUser.username.toLowerCase() &&
        p.username.toLowerCase() !== 'shashwath71845' &&
        (p.class !== currentUser.class || (p.section || 'A') !== (currentUser.section || 'A'))
    );

    const shashwathProfile = allProfiles.find((p) => p.username.toLowerCase() === 'shashwath71845') || {
      id: 'admin-shashwath-id',
      username: 'shashwath71845',
      fullName: 'Shashwath Salla',
      bio: 'DPS Buzz Super Administrator 🛡️',
      avatar: null,
      role: 'admin',
      isVerified: true,
      class: 'Staff',
      section: 'Admin',
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    } as Profile;

    return [shashwathProfile, ...classmates, ...otherStudents];
  }, [allProfiles, currentUser]);

  // 4. Comprehensive Live Search Matching Accounts & Posts by Keyword (including class numbers 6, 7, 8, 9, 10)
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    // Filter Accounts (matching name, username, class numbers like 6, 7, 8, 9, 10, section, bio)
    const matchedPeople = allProfiles.filter((p) => {
      if (!p || !p.username) return false;
      const cleanUser = p.username.toLowerCase();
      if (cleanUser === 'admin') return false;

      if (!q) {
        const matchClass = selectedClass === 'All' || p.class === selectedClass;
        const matchSection = selectedSection === 'All' || (p.section || 'A') === selectedSection;
        return matchClass && matchSection;
      }

      const u = cleanUser;
      const n = (p.fullName || '').toLowerCase();
      const c = (p.class || '').toLowerCase();
      const s = (p.section || '').toLowerCase();
      const bio = (p.bio || '').toLowerCase();
      const fullClass = `class ${c}`;
      const classSec = `${c}${s}`;
      const classDashSec = `${c}-${s}`;

      // Check if user specifically entered a class/section search like "7", "7th", "class 7", "7-b", "8 g"
      const classQueryMatch =
        q.match(/^(?:class|grade)?\s*(\d{1,2})(?:th)?(?:\s*class)?\s*[-_\s/]?\s*([a-gA-G])?$/i) ||
        (q.match(/^(\d{1,2})$/) ? [q, q, undefined] : null);

      let matchKeyword = false;
      if (classQueryMatch) {
        const queryClassNum = classQueryMatch[1];
        const querySection = classQueryMatch[2]?.toLowerCase();
        const cleanClass = c.replace(/[^0-9]/g, '');
        if (cleanClass === queryClassNum) {
          if (!querySection || s === querySection) {
            matchKeyword = true;
          }
        }
      }

      // If not a pure class query or didn't match class query, search name, username, bio
      if (!matchKeyword) {
        // Prevent single digit substring match in username (e.g. typing "7" should NEVER match shashwath71845)
        const isNumericOnly = /^\d+$/.test(q);
        const matchUser = !isNumericOnly && (u === q || u.includes(q));
        const matchName = !isNumericOnly && n.includes(q);
        const matchBio = !isNumericOnly && bio.includes(q);
        const matchClassSec =
          c === q ||
          fullClass === q ||
          classSec === q ||
          classDashSec === q ||
          `class ${classSec}` === q ||
          `class ${classDashSec}` === q;

        matchKeyword = matchUser || matchName || matchBio || matchClassSec;
      }

      const matchClass =
        selectedClass === 'All' ||
        c === selectedClass.toLowerCase() ||
        c.replace(/[^0-9]/g, '') === selectedClass;
      const matchSection =
        selectedSection === 'All' || (p.section || 'A').toUpperCase() === selectedSection.toUpperCase();

      return matchKeyword && matchClass && matchSection;
    });

    const profileMap = new Map(allProfiles.map((p) => [p.username.toLowerCase(), p]));
    const myUser = currentUser?.username?.toLowerCase().trim() || '';

    // Filter Posts (matching caption, author username, author full name, author class like 6, 7, 10, hashtags, songs)
    const matchedPosts = posts.filter((p) => {
      if (!p || !p.username) return false;
      const author = p.username.toLowerCase().trim();
      if (author !== myUser) {
        const authorProf = profileMap.get(author);
        if (authorProf?.isPrivate && !isFollowing(author)) {
          return false; // Private posts only showed to their followers
        }
      }

      const postAuthorClass = (p.class || '').toLowerCase();
      const cleanPostClass = postAuthorClass.replace(/[^0-9]/g, '');

      if (!q) {
        if (selectedClass === 'All') return true;
        return cleanPostClass === selectedClass;
      }

      const caption = (p.caption || '').toLowerCase();
      const authorUser = (p.username || '').toLowerCase();
      const authorName = (p.fullName || '').toLowerCase();
      const habit = (p.habitTag || p.habitCategory || '').toLowerCase();
      const songTitle = (p.song?.title || '').toLowerCase();
      const songArtist = (p.song?.artist || '').toLowerCase();

      const classQueryMatch =
        q.match(/^(?:class|grade)?\s*(\d{1,2})(?:th)?(?:\s*class)?$/i) ||
        (q.match(/^(\d{1,2})$/) ? [q, q] : null);

      let matchKeyword = false;
      if (classQueryMatch) {
        const queryClassNum = classQueryMatch[1];
        if (cleanPostClass === queryClassNum) {
          matchKeyword = true;
        }
      }

      if (!matchKeyword) {
        const isNumericOnly = /^\d+$/.test(q);
        matchKeyword =
          caption.includes(q) ||
          (!isNumericOnly && authorUser.includes(q)) ||
          (!isNumericOnly && authorName.includes(q)) ||
          cleanPostClass === q ||
          `class ${cleanPostClass}` === q ||
          habit.includes(q) ||
          songTitle.includes(q) ||
          songArtist.includes(q);
      }

      const matchClass =
        selectedClass === 'All' || cleanPostClass === selectedClass;

      return matchKeyword && matchClass;
    });

    return {
      people: matchedPeople,
      posts: matchedPosts,
      totalCount: activeChip === 'Accounts' ? matchedPeople.length : matchedPosts.length,
    };
  }, [query, activeChip, allProfiles, posts, selectedClass, selectedSection]);

  // Keep ONLY 2 BARS as requested: Accounts & Posts
  const chipTabs = ['Accounts', 'Posts'] as const;

  return (
    <div className="space-y-0 min-h-dvh max-w-[480px] mx-auto select-none">
      {/* 1. Search Field 48px with clear button and filter sheet button */}
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
            placeholder="Search by class (6, 7, 8, 10), name, or keyword..."
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

      {/* 2. ONLY 2 BARS (TABS): Accounts & Posts */}
      <div className="px-4 py-2 flex gap-2 sticky top-[60px] z-20 bg-[var(--surface)] border-b border-[var(--line)]">
        {chipTabs.map((chip) => {
          const isSelected = activeChip === chip;
          const count = chip === 'Accounts' ? searchResults.people.length : searchResults.posts.length;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              className="flex-1 h-10 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 select-none shadow-2xs"
              style={{
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-sunken)',
                color: isSelected ? 'var(--on-primary)' : 'var(--text-muted)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--line)',
              }}
            >
              <span>{chip === 'Accounts' ? '👤 Accounts' : '📸 Posts'}</span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface)',
                  color: isSelected ? 'var(--on-primary)' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Class Shortcut Chips: 6, 7, 8, 9, 10, All */}
      <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[var(--line)]/50 bg-[var(--surface)]">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase shrink-0 mr-1">Class:</span>
        {['All', '6', '7', '8', '9', '10'].map((cls) => {
          const isActive = selectedClass === cls;
          return (
            <button
              key={cls}
              type="button"
              onClick={() => {
                setSelectedClass(cls);
              }}
              className={`h-7 px-3 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
              }`}
            >
              {cls === 'All' ? 'All Classes' : `Class ${cls}`}
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
                DPS Dilsukhnagar student community
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

      {/* Loading & Error States */}
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
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[var(--primary)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      ) : !query && activeChip === 'Accounts' && selectedClass === 'All' && selectedSection === 'All' ? (
        /* ACCOUNTS DEFAULT STATE: Recent searches + Star of the Week + Suggested Classmates */
        <div className="space-y-4">
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

          {/* Hero Card: Star of the Week */}
          <HeroCard
            winners={starWinner}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
            isRequested={(tar) =>
              followRequests.some(
                (r) =>
                  r.requester.toLowerCase() === (currentUser?.username || '').toLowerCase() &&
                  r.target.toLowerCase() === tar.toLowerCase()
              ) || DataStore.hasRequestedFollow(currentUser?.username || '', tar)
            }
            currentUsername={currentUser?.username}
          />

          {/* Suggested Classmates List (Instagram Style) */}
          <div className="px-4 pb-8">
            <div
              className="p-4 rounded-[22px] border shadow-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <SuggestedAccountsList
                limit={10}
                showHeader={true}
                onFollowToggled={(target) => {
                  handleFollowToggle(target);
                }}
              />
            </div>
          </div>
        </div>
      ) : !query && activeChip === 'Posts' ? (
        /* POSTS DEFAULT STATE: Trending school posts */
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2 select-none">
            <Flame size={18} className="text-[var(--primary)]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Trending School Posts
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {trendingPosts.map((post) => {
              const photo = post.imageUrl || (post.images && post.images[0]) || '';
              return (
                <Link
                  key={post.id}
                  href={`/home#post-${post.id}`}
                  className="w-full aspect-[4/5] rounded-[16px] overflow-hidden relative group select-none shadow-xs border border-[var(--line)]"
                  style={{ backgroundColor: 'var(--surface-sunken)' }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`Post by ${post.username}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] p-3 text-center gradient-bg text-white">
                      {post.caption?.slice(0, 40) || 'School Post'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                    <p className="text-[11px] font-bold truncate">@{post.username}</p>
                    <p className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                      <Heart size={10} className="fill-rose-500 text-rose-500" />
                      <span>{post.likes} likes</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : activeChip === 'Accounts' ? (
        /* ACTIVE SEARCH: ACCOUNTS RESULTS */
        <div className="px-4 py-3 space-y-3">
          {searchResults.people.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl">
                👤
              </div>
              <p className="text-sm font-bold text-[var(--text)]">
                {query ? `No student accounts found for "${query}"` : 'No accounts found in this class'}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                Try searching by class number like &quot;6&quot;, &quot;7&quot;, &quot;8&quot;, &quot;10&quot; or by a classmate&apos;s name.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Found {searchResults.people.length} {searchResults.people.length === 1 ? 'Account' : 'Accounts'}
              </p>

              {searchResults.people.map((person) => {
                const following = isFollowing(person.username);
                const hasRequested =
                  followRequests.some(
                    (r) =>
                      r.requester.toLowerCase() === (currentUser?.username || '').toLowerCase() &&
                      r.target.toLowerCase() === person.username.toLowerCase()
                  ) || DataStore.hasRequestedFollow(currentUser?.username || '', person.username);
                const hasIncomingRequest =
                  followRequests.some(
                    (r) =>
                      r.requester.toLowerCase() === person.username.toLowerCase() &&
                      r.target.toLowerCase() === (currentUser?.username || '').toLowerCase()
                  ) || DataStore.hasRequestedFollow(person.username, currentUser?.username || '');
                const isFollowedByThem =
                  follows.some(
                    (f) =>
                      f.follower.toLowerCase() === person.username.toLowerCase() &&
                      f.following.toLowerCase() === (currentUser?.username || '').toLowerCase()
                  ) || (currentUser?.username ? DataStore.isFollowing(person.username, currentUser.username) : false);
                const mutuals = currentUser?.username
                  ? DataStore.getMutualFollows(currentUser.username, person.username)
                  : [];
                const pair = getAvatarColorPair(person.username);
                const isShashwath = person.username.toLowerCase() === 'shashwath71845';

                return (
                  <div
                    key={person.id}
                    className="p-3 rounded-[16px] border flex items-center justify-between gap-3 bg-[var(--surface)] hover:border-[var(--line-strong)] transition-all"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <Link
                      href={`/u/${person.username}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[var(--line)]"
                        style={{ backgroundColor: isShashwath ? '#FF5A1F' : pair.bg, color: '#fff' }}
                      >
                        {(person.avatar || DataStore.getProfileByUsername(person.username)?.avatar) ? (
                          <img src={person.avatar || DataStore.getProfileByUsername(person.username)?.avatar || ''} alt={person.fullName} className="w-full h-full object-cover" />
                        ) : (
                          person.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[var(--text)] truncate">
                            {person.fullName}
                          </p>
                          {person.isVerified && (
                            <span className="text-blue-400 text-[10px]">✓</span>
                          )}
                          {person.isPrivate && (
                            <span className="text-[10px] text-[var(--text-muted)]" title="Private Account">🔒</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          @{person.username} · {isShashwath ? 'School Admin' : `Class ${person.class}-${person.section || 'A'}`}
                        </p>
                        {mutuals.length > 0 && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate pt-0.5">
                            Followed by @{mutuals[0]}{mutuals.length > 1 ? ` +${mutuals.length - 1} other${mutuals.length > 2 ? 's' : ''}` : ''}
                          </p>
                        )}
                      </div>
                    </Link>

                    {currentUser?.username.toLowerCase().trim() !== person.username.toLowerCase().trim() && (
                      <button
                        type="button"
                        onClick={() => handleFollowToggle(person.username)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-all active:scale-95 shadow-xs"
                        style={{
                          backgroundColor: hasIncomingRequest
                            ? 'var(--primary)'
                            : following || hasRequested
                            ? 'var(--surface-sunken)'
                            : 'var(--primary)',
                          color: hasIncomingRequest
                            ? 'var(--on-primary)'
                            : following || hasRequested
                            ? 'var(--text)'
                            : 'var(--on-primary)',
                          border: hasIncomingRequest
                            ? 'none'
                            : following || hasRequested
                            ? '1px solid var(--line)'
                            : 'none',
                        }}
                      >
                        {following
                          ? 'Following'
                          : hasRequested
                          ? 'Requested 🔒'
                          : hasIncomingRequest
                          ? 'Confirm'
                          : isFollowedByThem
                          ? 'Follow Back'
                          : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE SEARCH: POSTS RESULTS */
        <div className="px-4 py-3 space-y-3">
          {searchResults.posts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[var(--primary)]/10 text-[var(--primary)] text-xl">
                📸
              </div>
              <p className="text-sm font-bold text-[var(--text)]">
                {query ? `No posts found matching "${query}"` : 'No posts in this class yet'}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                Be the first to share a moment, or try searching by class number like &quot;6&quot;, &quot;7&quot;, &quot;10&quot; or hashtags.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Found {searchResults.posts.length} {searchResults.posts.length === 1 ? 'Post' : 'Posts'}
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {searchResults.posts.map((post) => {
                  const photo = post.imageUrl || (post.images && post.images[0]) || '';
                  return (
                    <Link
                      key={post.id}
                      href={`/home#post-${post.id}`}
                      className="w-full aspect-[4/5] rounded-[16px] overflow-hidden relative group select-none shadow-xs border border-[var(--line)]"
                      style={{ backgroundColor: 'var(--surface-sunken)' }}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt={`Post by ${post.username}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] p-3 text-center gradient-bg text-white">
                          {post.caption?.slice(0, 40) || 'School Post'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                        <p className="text-[11px] font-bold truncate">@{post.username}</p>
                        {post.caption && (
                          <p className="text-[10px] text-white/80 line-clamp-1 italic">
                            &ldquo;{post.caption}&rdquo;
                          </p>
                        )}
                        <p className="text-[10px] text-white/90 flex items-center gap-1 mt-1 font-bold">
                          <Heart size={10} className="fill-rose-500 text-rose-500" />
                          <span>{post.likes} likes</span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class & Section Filter Bottom Sheet */}
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
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
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
                className="flex-1 py-2.5 rounded-full text-xs font-semibold border text-[var(--text)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                style={{ borderColor: 'var(--line)' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-white shadow-sm cursor-pointer"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Apply Filters
              </button>
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
