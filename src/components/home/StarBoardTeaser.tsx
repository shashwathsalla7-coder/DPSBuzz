'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Flame, ChevronRight, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore, HabitStreak, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';

export interface StarBoardTeaserProps {
  topStudents?: Array<{
    rank: number;
    username: string;
    fullName: string;
    points: number;
    className: string;
  }>;
  streaks?: HabitStreak[];
}

export const StarBoardTeaser: React.FC<StarBoardTeaserProps> = ({
  topStudents: initialTopStudents,
  streaks: initialStreaks,
}) => {
  const [topStudents, setTopStudents] = useState<
    Array<{
      rank: number;
      username: string;
      fullName: string;
      points: number;
      className: string;
      avatar?: string | null;
    }>
  >(initialTopStudents || []);

  const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>(initialStreaks || []);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'streaks'>('leaderboard');

  useEffect(() => {
    const loadData = () => {
      // 1. Load profiles and rank by followers and activity
      const deletedUsers = DataStore.getDeletedUsernames();
      const allProfiles = DataStore.getProfiles();
      const validProfiles = allProfiles.filter(
        (p) =>
          p &&
          p.username &&
          !DUMMY_TEST_USERNAMES.has(p.username.toLowerCase().trim()) &&
          !deletedUsers.has(p.username.toLowerCase().trim()) &&
          p.username.toLowerCase() !== 'admin'
      );

      const ranked = [...validProfiles]
        .sort((a, b) => {
          const scoreA = (a.followerCount || 0) * 15 + (a.postCount || 0) * 10;
          const scoreB = (b.followerCount || 0) * 15 + (b.postCount || 0) * 10;
          return scoreB - scoreA;
        })
        .slice(0, 3)
        .map((p, idx) => ({
          rank: idx + 1,
          username: p.username,
          fullName: p.fullName,
          avatar: p.avatar || null,
          points: (p.followerCount || 0) * 15 + (p.postCount || 0) * 10,
          className: p.class ? `Class ${p.class}` : 'Student',
        }));

      setTopStudents(ranked);

      // 2. Load habit streaks
      const liveStreaks = DataStore.getHabitStreaks().filter((s) => {
        if (!s || !s.username) return false;
        const u = s.username.toLowerCase().trim();
        return !deletedUsers.has(u) && !DUMMY_TEST_USERNAMES.has(u);
      });
      setHabitStreaks(liveStreaks.slice(0, 3));
    };

    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const firstStudent = topStudents.find((s) => s.rank === 1) || topStudents[0] || null;
  const secondStudent = topStudents.find((s) => s.rank === 2) || topStudents[1] || null;
  const thirdStudent = topStudents.find((s) => s.rank === 3) || topStudents[2] || null;

  const firstStreak = habitStreaks[0] || null;
  const secondStreak = habitStreaks[1] || null;
  const thirdStreak = habitStreaks[2] || null;

  return (
    <div
      className="mx-3 my-4 p-4 rounded-[24px] border select-none transition-all shadow-sm relative overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-sunken)',
        borderColor: 'var(--line)',
      }}
    >
      {/* Header with redirect shortcut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: activeTab === 'leaderboard' ? 'var(--primary-tint)' : 'rgba(239, 68, 68, 0.15)',
              color: activeTab === 'leaderboard' ? 'var(--primary)' : '#EF4444',
            }}
          >
            {activeTab === 'leaderboard' ? <Trophy size={16} /> : <Flame size={16} />}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              <span>{activeTab === 'leaderboard' ? 'Star Board' : 'Habit Streaks'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-pink-500/15 text-pink-500">Live</span>
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              {activeTab === 'leaderboard'
                ? "This week's top student ranks"
                : 'Top daily study & sport streaks'}
            </p>
          </div>
        </div>

        <Link
          href="/leaderboard"
          className="btn-apple text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--primary)',
            border: '1px solid var(--line)',
          }}
        >
          <span>Full Board</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Segmented Switcher */}
      <div
        className="flex p-1 rounded-xl mb-3 border text-xs font-bold"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`btn-apple flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-[var(--surface-sunken)] shadow-xs font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{
            color: activeTab === 'leaderboard' ? 'var(--text)' : undefined,
          }}
        >
          <Trophy size={13} className={activeTab === 'leaderboard' ? 'text-amber-500' : ''} />
          <span>Star Board</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('streaks')}
          className={`btn-apple flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'streaks'
              ? 'bg-[var(--surface-sunken)] shadow-xs font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
          style={{
            color: activeTab === 'streaks' ? 'var(--text)' : undefined,
          }}
        >
          <Flame size={13} className={activeTab === 'streaks' ? 'text-orange-500' : ''} />
          <span>Streaks</span>
        </button>
      </div>

      {/* 1-2-3 PODIUM PRESENTATION: STAR BOARD */}
      {activeTab === 'leaderboard' && (
        <>
          {topStudents.length === 0 ? (
            <div
              className="p-3.5 rounded-[16px] border text-center my-1"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <Sparkles size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-xs font-bold text-[var(--text)]">School Star Board Open</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Share moments with classmates to take the top podium!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 items-end pt-3 pb-1 text-center">
              {/* RANK 2 - SILVER (LEFT) */}
              {secondStudent ? (
                <Link
                  href={`/u/${secondStudent.username}`}
                  className="btn-apple p-2 rounded-[16px] border flex flex-col items-center transition"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="relative mb-1">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-slate-400 shadow-xs overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(secondStudent.username).bg,
                        color: getAvatarColorPair(secondStudent.username).text,
                      }}
                    >
                      {secondStudent.avatar || DataStore.getProfileByUsername(secondStudent.username)?.avatar ? (
                        <img
                          src={secondStudent.avatar || DataStore.getProfileByUsername(secondStudent.username)?.avatar || ''}
                          alt={secondStudent.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        secondStudent.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-slate-900 bg-slate-300 ring-1 ring-[var(--surface)] shadow-xs">
                      2
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text)] truncate w-full">
                    {secondStudent.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                    🥈 Silver
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium tabular-nums">
                    {secondStudent.points} pts
                  </p>
                </Link>
              ) : (
                <div className="p-2 rounded-[16px] border border-dashed border-slate-400/40 flex flex-col items-center opacity-60">
                  <div className="w-10 h-10 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-slate-400 text-xs mb-1 font-bold">
                    2
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Spot 2</p>
                </div>
              )}

              {/* RANK 1 - GOLD (CENTER, ELEVATED WITH CROWN) */}
              {firstStudent ? (
                <Link
                  href={`/u/${firstStudent.username}`}
                  className="btn-apple p-2.5 rounded-[18px] border flex flex-col items-center transition -translate-y-2 shadow-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                  }}
                >
                  <Crown size={14} className="text-amber-500 mb-0.5 animate-bounce" />
                  <div className="relative mb-1">
                    <div
                      className="w-13 h-13 rounded-full flex items-center justify-center font-black text-sm ring-3 ring-amber-400 shadow-md overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(firstStudent.username).bg,
                        color: getAvatarColorPair(firstStudent.username).text,
                      }}
                    >
                      {firstStudent.avatar || DataStore.getProfileByUsername(firstStudent.username)?.avatar ? (
                        <img
                          src={firstStudent.avatar || DataStore.getProfileByUsername(firstStudent.username)?.avatar || ''}
                          alt={firstStudent.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        firstStudent.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-amber-950 bg-gradient-to-tr from-amber-400 to-yellow-300 ring-1 ring-[var(--surface)] shadow-xs">
                      1
                    </span>
                  </div>
                  <p className="text-xs font-black text-[var(--text)] truncate w-full">
                    {firstStudent.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-wide">
                    👑 Gold
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold tabular-nums">
                    {firstStudent.points} pts
                  </p>
                </Link>
              ) : null}

              {/* RANK 3 - BRONZE (RIGHT) */}
              {thirdStudent ? (
                <Link
                  href={`/u/${thirdStudent.username}`}
                  className="btn-apple p-2 rounded-[16px] border flex flex-col items-center transition"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="relative mb-1">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-orange-600 shadow-xs overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(thirdStudent.username).bg,
                        color: getAvatarColorPair(thirdStudent.username).text,
                      }}
                    >
                      {thirdStudent.avatar || DataStore.getProfileByUsername(thirdStudent.username)?.avatar ? (
                        <img
                          src={thirdStudent.avatar || DataStore.getProfileByUsername(thirdStudent.username)?.avatar || ''}
                          alt={thirdStudent.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        thirdStudent.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white bg-orange-700 ring-1 ring-[var(--surface)] shadow-xs">
                      3
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text)] truncate w-full">
                    {thirdStudent.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-orange-600 font-extrabold uppercase tracking-wide">
                    🥉 Bronze
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium tabular-nums">
                    {thirdStudent.points} pts
                  </p>
                </Link>
              ) : (
                <div className="p-2 rounded-[16px] border border-dashed border-orange-500/40 flex flex-col items-center opacity-60">
                  <div className="w-10 h-10 rounded-full border border-dashed border-orange-500 flex items-center justify-center text-orange-500 text-xs mb-1 font-bold">
                    3
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Spot 3</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 1-2-3 PODIUM PRESENTATION: HABIT STREAKS */}
      {activeTab === 'streaks' && (
        <>
          {habitStreaks.length === 0 ? (
            <div
              className="p-3.5 rounded-[16px] border text-center my-1"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <Flame size={20} className="mx-auto text-orange-500 mb-1" />
              <p className="text-xs font-bold text-[var(--text)]">Ignite Your Streak! 🔥</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Post with #studies or #sports to start your daily streak.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 items-end pt-3 pb-1 text-center">
              {/* RANK 2 - SILVER (LEFT) */}
              {secondStreak ? (
                <Link
                  href={`/u/${secondStreak.username}`}
                  className="btn-apple p-2 rounded-[16px] border flex flex-col items-center transition"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="relative mb-1">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-slate-400 shadow-xs overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(secondStreak.username).bg,
                        color: getAvatarColorPair(secondStreak.username).text,
                      }}
                    >
                      {DataStore.getProfileByUsername(secondStreak.username)?.avatar || secondStreak.avatar ? (
                        <img
                          src={DataStore.getProfileByUsername(secondStreak.username)?.avatar || secondStreak.avatar || ''}
                          alt={secondStreak.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        secondStreak.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-slate-900 bg-slate-300 ring-1 ring-[var(--surface)] shadow-xs">
                      2
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text)] truncate w-full">
                    {secondStreak.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-orange-500 font-extrabold tabular-nums">
                    🔥 {secondStreak.streakDays}d
                  </p>
                </Link>
              ) : (
                <div className="p-2 rounded-[16px] border border-dashed border-slate-400/40 flex flex-col items-center opacity-60">
                  <div className="w-10 h-10 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-slate-400 text-xs mb-1 font-bold">
                    2
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Spot 2</p>
                </div>
              )}

              {/* RANK 1 - GOLD (CENTER, ELEVATED WITH CROWN) */}
              {firstStreak ? (
                <Link
                  href={`/u/${firstStreak.username}`}
                  className="btn-apple p-2.5 rounded-[18px] border flex flex-col items-center transition -translate-y-2 shadow-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                  }}
                >
                  <Crown size={14} className="text-amber-500 mb-0.5 animate-bounce" />
                  <div className="relative mb-1">
                    <div
                      className="w-13 h-13 rounded-full flex items-center justify-center font-black text-sm ring-3 ring-amber-400 shadow-md overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(firstStreak.username).bg,
                        color: getAvatarColorPair(firstStreak.username).text,
                      }}
                    >
                      {DataStore.getProfileByUsername(firstStreak.username)?.avatar || firstStreak.avatar ? (
                        <img
                          src={DataStore.getProfileByUsername(firstStreak.username)?.avatar || firstStreak.avatar || ''}
                          alt={firstStreak.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        firstStreak.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-amber-950 bg-gradient-to-tr from-amber-400 to-yellow-300 ring-1 ring-[var(--surface)] shadow-xs">
                      1
                    </span>
                  </div>
                  <p className="text-xs font-black text-[var(--text)] truncate w-full">
                    {firstStreak.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-orange-500 font-black tabular-nums">
                    🔥 {firstStreak.streakDays}d streak
                  </p>
                </Link>
              ) : null}

              {/* RANK 3 - BRONZE (RIGHT) */}
              {thirdStreak ? (
                <Link
                  href={`/u/${thirdStreak.username}`}
                  className="btn-apple p-2 rounded-[16px] border flex flex-col items-center transition"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <div className="relative mb-1">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-orange-600 shadow-xs overflow-hidden"
                      style={{
                        backgroundColor: getAvatarColorPair(thirdStreak.username).bg,
                        color: getAvatarColorPair(thirdStreak.username).text,
                      }}
                    >
                      {DataStore.getProfileByUsername(thirdStreak.username)?.avatar || thirdStreak.avatar ? (
                        <img
                          src={DataStore.getProfileByUsername(thirdStreak.username)?.avatar || thirdStreak.avatar || ''}
                          alt={thirdStreak.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        thirdStreak.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white bg-orange-700 ring-1 ring-[var(--surface)] shadow-xs">
                      3
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--text)] truncate w-full">
                    {thirdStreak.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-orange-500 font-extrabold tabular-nums">
                    🔥 {thirdStreak.streakDays}d
                  </p>
                </Link>
              ) : (
                <div className="p-2 rounded-[16px] border border-dashed border-orange-500/40 flex flex-col items-center opacity-60">
                  <div className="w-10 h-10 rounded-full border border-dashed border-orange-500 flex items-center justify-center text-orange-500 text-xs mb-1 font-bold">
                    3
                  </div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)]">Spot 3</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Prominent Bottom Redirect to Full Leaderboard & Streaks */}
      <div className="mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--line)' }}>
        <Link
          href="/leaderboard"
          className="btn-apple w-full py-2.5 px-3 rounded-[14px] flex items-center justify-center gap-1.5 text-xs font-bold transition-all text-white shadow-xs"
          style={{
            background: 'linear-gradient(135deg, #833AB4, #C13584, #F77737)',
          }}
        >
          <span>View Full Leaderboard & Streaks</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
};

export default StarBoardTeaser;
