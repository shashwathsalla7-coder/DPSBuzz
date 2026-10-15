'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Trophy,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Zap,
  X,
  Crown,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { DataStore, HabitStreak, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export interface HomeStreakWidgetProps {
  onDismiss?: () => void;
  compact?: boolean;
}

/**
 * Interactive Home Feed Mini-Widget:
 * Displays user's daily habit streak, spirit/strike points balance,
 * school Star Board rank, and today's streak check-in action.
 */
export const HomeStreakWidget: React.FC<HomeStreakWidgetProps> = ({
  onDismiss,
  compact = false,
}) => {
  const [currentUser, setCurrentUser] = useState(() => DataStore.getCurrentUser());
  const [userStreak, setUserStreak] = useState<HabitStreak | null>(null);
  const [topStudent, setTopStudent] = useState<{
    username: string;
    fullName: string;
    points: number;
    rank: number;
  } | null>(null);
  const [myRank, setMyRank] = useState<number>(1);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const loadStreakData = () => {
      const cur = DataStore.getCurrentUser();
      setCurrentUser(cur);
      const cleanUser = (cur?.username || '').toLowerCase().trim();
      if (!cleanUser || cleanUser === 'guest') return;

      // 1. Get user habit streak
      const streak = DataStore.getUserHabitStreak(cleanUser);
      setUserStreak(streak);

      // 2. Check if user posted today
      const today = new Date().toDateString();
      const userPosts = DataStore.getPosts().filter(
        (p) => (p.username || '').toLowerCase().trim() === cleanUser
      );
      const posted = userPosts.some(
        (p) => new Date(p.createdAt).toDateString() === today
      );
      setHasPostedToday(posted || Boolean(streak?.postedToday));

      // 3. Compute Star Board Leaderboard ranks
      const deletedUsers = DataStore.getDeletedUsernames();
      const allProfiles = DataStore.getProfiles().filter(
        (p) =>
          p &&
          p.username &&
          !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase().trim()) &&
          !deletedUsers.has(p.username.toLowerCase().trim()) &&
          p.username.toLowerCase() !== 'admin'
      );

      const ranked = [...allProfiles]
        .sort((a, b) => {
          const scoreA = (a.followerCount || 0) * 15 + (a.postCount || 0) * 10 + (a.spiritPoints || 0);
          const scoreB = (b.followerCount || 0) * 15 + (b.postCount || 0) * 10 + (b.spiritPoints || 0);
          return scoreB - scoreA;
        })
        .map((p, idx) => ({
          rank: idx + 1,
          username: p.username,
          fullName: p.fullName,
          points: (p.followerCount || 0) * 15 + (p.postCount || 0) * 10 + (p.spiritPoints || 0),
        }));

      if (ranked.length > 0) {
        setTopStudent(ranked[0]);
      }

      const myIndex = ranked.findIndex(
        (r) => r.username.toLowerCase().trim() === cleanUser
      );
      setMyRank(myIndex >= 0 ? myIndex + 1 : ranked.length + 1);
    };

    loadStreakData();

    const handleUpdate = () => loadStreakData();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (isDismissed) return null;

  const streakDays = userStreak ? userStreak.streakDays : 1;
  const habitPoints = userStreak ? userStreak.habitPoints : 25;
  const spiritPoints = (currentUser?.spiritPoints || 0) + habitPoints;
  const primaryHabit = userStreak?.primaryHabit || 'Studies';

  // Compact Pill Mode (displayed directly below Stories row)
  if (compact) {
    return (
      <div className="px-3 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar select-none animate-fade-in">
        <Link
          href="/leaderboard?tab=streaks"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-xs"
        >
          <Flame size={14} className="animate-pulse text-orange-500 fill-orange-500" />
          <span>{streakDays}d Streak</span>
          {hasPostedToday && (
            <span className="text-[10px] px-1 rounded-full bg-orange-500/20 text-orange-300 font-extrabold">
              ✓ Active
            </span>
          )}
        </Link>

        <Link
          href="/leaderboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-xs"
        >
          <span>🐝</span>
          <span>{spiritPoints} Strike Pts</span>
        </Link>

        <Link
          href="/leaderboard?tab=leaders"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-xs"
        >
          <Trophy size={13} className="text-amber-400" />
          <span>Rank #{myRank}</span>
        </Link>

        {!hasPostedToday && (
          <Link
            href="/post/new"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold shrink-0 transition-transform active:scale-95 shadow-xs hover:opacity-90 ml-auto"
          >
            <Plus size={13} strokeWidth={3} />
            <span>Post Today</span>
          </Link>
        )}
      </div>
    );
  }

  // Full In-Feed Widget Card Mode
  return (
    <div
      className="mx-3 my-4 p-4 rounded-[24px] border select-none transition-all shadow-sm relative overflow-hidden animate-fade-in"
      style={{
        backgroundColor: 'var(--surface-sunken)',
        borderColor: 'var(--line)',
      }}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

      {/* Widget Header with dismiss button */}
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xs">
            <Flame size={17} className="fill-orange-500 animate-pulse" />
          </div>
          <div>
            <h4
              className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--text)' }}
            >
              <span>Daily Streak & Strike Points</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-orange-500/20 text-orange-400">
                School Live ⚡
              </span>
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              Daily habit tracker & school ranking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/leaderboard"
            className="btn-apple text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--primary)',
              border: '1px solid var(--line)',
            }}
          >
            <span>Star Board</span>
            <ChevronRight size={13} />
          </Link>

          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              if (onDismiss) onDismiss();
            }}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Dismiss widget"
            title="Dismiss widget"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 3 Core Stats Grid: Streak Days, Spirit Points, School Rank */}
      <div className="grid grid-cols-3 gap-2 mb-3.5 relative z-10">
        {/* Stat 1: Streak */}
        <Link
          href="/leaderboard?tab=streaks"
          className="p-2.5 rounded-2xl border text-center transition-transform active:scale-95 hover:border-orange-500/40 cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {streakDays}d
            </span>
          </div>
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tight">
            Streak Fire
          </p>
          <p className="text-[9px] text-[var(--text-muted)] truncate font-medium mt-0.5">
            {primaryHabit}
          </p>
        </Link>

        {/* Stat 2: Strike / Spirit Points */}
        <Link
          href="/leaderboard"
          className="p-2.5 rounded-2xl border text-center transition-transform active:scale-95 hover:border-purple-500/40 cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <span className="text-sm">🐝</span>
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {spiritPoints}
            </span>
          </div>
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tight">
            Strike Points
          </p>
          <p className="text-[9px] text-[var(--text-muted)] truncate font-medium mt-0.5">
            +{habitPoints} from habits
          </p>
        </Link>

        {/* Stat 3: School Star Board Rank */}
        <Link
          href="/leaderboard?tab=leaders"
          className="p-2.5 rounded-2xl border text-center transition-transform active:scale-95 hover:border-amber-500/40 cursor-pointer"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Trophy size={15} className="text-amber-500" />
            <span className="text-base font-black tracking-tight" style={{ color: 'var(--text)' }}>
              #{myRank}
            </span>
          </div>
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-tight">
            School Rank
          </p>
          <p className="text-[9px] text-[var(--text-muted)] truncate font-medium mt-0.5">
            DPS Star Board
          </p>
        </Link>
      </div>

      {/* Today's Streak Status & Call-To-Action */}
      <div
        className="p-3 rounded-2xl border flex items-center justify-between gap-3 relative z-10"
        style={{
          backgroundColor: hasPostedToday ? 'rgba(34, 197, 94, 0.08)' : 'var(--surface)',
          borderColor: hasPostedToday ? 'rgba(34, 197, 94, 0.3)' : 'var(--line)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              hasPostedToday
                ? 'bg-emerald-500/20 text-emerald-500'
                : 'bg-orange-500/20 text-orange-500'
            }`}
          >
            {hasPostedToday ? (
              <CheckCircle2 size={16} />
            ) : (
              <Zap size={15} className="animate-bounce" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text)] truncate">
              {hasPostedToday ? 'Streak Safe for Today! 🎉' : 'Keep Your Streak Alive! 🔥'}
            </p>
            <p className="text-[10.5px] text-[var(--text-muted)] truncate">
              {hasPostedToday
                ? 'Great job! +25 Strike Points earned today.'
                : 'Post a study or sports moment today to earn +25 points.'}
            </p>
          </div>
        </div>

        {!hasPostedToday ? (
          <Link
            href="/post/new"
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white shrink-0 shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <span>+ Post Now</span>
          </Link>
        ) : (
          <span className="text-[11px] font-bold text-emerald-500 shrink-0">
            ✓ Done
          </span>
        )}
      </div>

      {/* Bottom Teaser for Top Student of the Week */}
      {topStudent && (
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Crown size={14} className="text-amber-500 shrink-0" />
            <span className="truncate">
              Top Student: <strong className="text-[var(--text)]">@{topStudent.username}</strong> ({topStudent.points} pts)
            </span>
          </div>
          <Link
            href="/leaderboard"
            className="font-bold text-[var(--primary)] hover:underline shrink-0 text-[11px] flex items-center gap-0.5 ml-2"
          >
            <span>View All</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
};
