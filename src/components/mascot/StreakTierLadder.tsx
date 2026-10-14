'use client';

import { useState } from 'react';
import { Flame, Sparkles, Trophy, Award, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface StreakTierLadderProps {
  currentStreakDays: number;
  habitPoints: number;
  onPostClick?: () => void;
}

export default function StreakTierLadder({
  currentStreakDays,
  habitPoints,
  onPostClick,
}: StreakTierLadderProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate current Tier & progression
  const tiers = [
    {
      id: 'good',
      label: 'Good',
      subtitle: '3+ Days Streak',
      icon: '🌱',
      minDays: 3,
      color: '#4CC38A',
      bgColor: 'rgba(76, 195, 138, 0.12)',
      perks: '+25 Habit Pts/day • Daily Habit Verification',
    },
    {
      id: 'better',
      label: 'Better',
      subtitle: '7+ Days Streak',
      icon: '⚡',
      minDays: 7,
      color: '#E3A94B',
      bgColor: 'rgba(227, 169, 75, 0.12)',
      perks: '+50 Pts Milestone • Bronze Habit Flame Aura',
    },
    {
      id: 'best',
      label: 'Best',
      subtitle: '14+ Days Streak',
      icon: '🏆',
      minDays: 14,
      color: '#F2B705',
      bgColor: 'rgba(242, 183, 5, 0.15)',
      perks: '+100 Pts Milestone • School Library Star Badge',
    },
  ];

  const currentTierIndex =
    currentStreakDays >= 14 ? 2 : currentStreakDays >= 7 ? 1 : currentStreakDays >= 3 ? 0 : -1;

  const currentTier = currentTierIndex >= 0 ? tiers[currentTierIndex] : null;

  // Percentage to 14 days
  const progressPercent = Math.min(100, Math.round((currentStreakDays / 14) * 100));

  return (
    <div
      className="p-3.5 rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
      }}
    >
      {/* Header: Personal Tier & Progress */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs shrink-0"
            style={{
              backgroundColor: currentTier ? currentTier.bgColor : 'var(--surface-sunken)',
              color: currentTier ? currentTier.color : 'var(--text-muted)',
            }}
          >
            {currentTier ? currentTier.icon : '🐣'}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{
                  fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                  color: currentTier ? currentTier.color : 'var(--text)',
                }}
              >
                {currentTier ? `${currentTier.label} Tier` : 'Starter Streak'}
              </span>
              <span className="text-xs font-bold text-amber-500 font-mono">
                🔥 {currentStreakDays}d streak
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {currentStreakDays >= 14
                ? '🏆 Best Tier active! You are a campus habit legend!'
                : currentStreakDays >= 7
                ? `⚡ Better Tier! Only ${14 - currentStreakDays} days to Best Tier!`
                : currentStreakDays >= 3
                ? `🌱 Good Tier! ${7 - currentStreakDays} days until Better Tier!`
                : `Post today to reach Good Tier (${3 - currentStreakDays} days left)`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-semibold text-[var(--primary)] hover:underline shrink-0 btn-press px-2 py-1 rounded-[6px]"
          style={{ backgroundColor: 'var(--surface-sunken)' }}
        >
          {expanded ? 'Hide Tiers' : 'View Tiers'}
        </button>
      </div>

      {/* Animated Visual Tier Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono text-[var(--text-muted)]">
          <span className={currentStreakDays >= 3 ? 'text-emerald-500' : ''}>Good (3d)</span>
          <span className={currentStreakDays >= 7 ? 'text-amber-500' : ''}>Better (7d)</span>
          <span className={currentStreakDays >= 14 ? 'text-yellow-500' : ''}>Best (14d) 🏆</span>
        </div>

        <div
          className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(6, progressPercent)}%`,
              background:
                currentStreakDays >= 14
                  ? 'linear-gradient(90deg, #4CC38A, #E3A94B, #F2B705)'
                  : currentStreakDays >= 7
                  ? 'linear-gradient(90deg, #4CC38A, #E3A94B)'
                  : '#4CC38A',
            }}
          />
        </div>
      </div>

      {/* Expanded Tiers Breakdown (Good, Better, Best) */}
      {expanded && (
        <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-[var(--line)] animate-fade-in">
          {tiers.map((t, idx) => {
            const isUnlocked = currentStreakDays >= t.minDays;
            const isCurrent = currentTierIndex === idx;

            return (
              <div
                key={t.id}
                className={`p-2 rounded-xl border text-center transition-all ${
                  isCurrent ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: isUnlocked ? t.bgColor : 'var(--surface-sunken)',
                  borderColor: isCurrent ? t.color : 'var(--line)',
                }}
              >
                <div className="text-base mb-1">{t.icon}</div>
                <div
                  className="text-xs font-bold leading-tight"
                  style={{
                    color: isUnlocked ? t.color : 'var(--text-muted)',
                    fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                  }}
                >
                  {t.label}
                </div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {t.subtitle}
                </div>
                <div className="mt-1.5">
                  {isUnlocked ? (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-[4px] inline-flex items-center gap-0.5"
                      style={{
                        backgroundColor: t.color,
                        color: '#000000',
                      }}
                    >
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      {t.minDays}d target
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
