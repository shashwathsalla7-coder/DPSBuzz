'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Trophy,
  Flame,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Award,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { SchoolFeatures, type DailyQuizQuestion, DAILY_QUESTIONS } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export default function QuestionBoxPage() {
  const [todayQ, setTodayQ] = useState<DailyQuizQuestion>(() => SchoolFeatures.getTodayQuestion());
  const [progress, setProgress] = useState(() => SchoolFeatures.getUserQuizProgress());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; points: number } | null>(null);

  const currentUser = DataStore.getCurrentUser();
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyAnsweredRecord = progress.answeredDates[todayStr];

  const handleSelectOption = (index: number) => {
    if (hasSubmitted || alreadyAnsweredRecord) return;
    setSelectedIdx(index);
    setHasSubmitted(true);
    const result = SchoolFeatures.submitQuizAnswer(todayQ.id, index);
    setFeedback(result);
    setProgress(SchoolFeatures.getUserQuizProgress());

    if (result.isCorrect && currentUser?.username) {
      // Award spirit points to student profile
      try {
        DataStore.addSpiritPoints(currentUser.username, 10);
      } catch {}
    }
  };

  const isAnswered = hasSubmitted || Boolean(alreadyAnsweredRecord);
  const activeSelected = selectedIdx !== null ? selectedIdx : alreadyAnsweredRecord?.selectedIndex;
  const isCorrect = feedback ? feedback.isCorrect : Boolean(alreadyAnsweredRecord?.isCorrect);

  return (
    <div className="space-y-4 pb-24 select-none max-w-2xl mx-auto">
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20 backdrop-blur-md"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="w-9 h-9 rounded-full flex items-center justify-center btn-press hover:bg-[var(--surface-sunken)] transition-colors"
            style={{ color: 'var(--text)' }}
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[var(--text)]">Question Box</h1>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Daily Challenge
            </span>
          </div>
        </div>

        {/* Streak & Points Pill */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Flame size={14} className="fill-amber-500" />
            <span>{progress.currentStreak} Day Streak</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Trophy size={14} />
            <span>+{progress.totalPointsWon} pts</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="px-4">
        <div
          className="p-5 rounded-3xl border bg-[var(--surface)] shadow-md space-y-4 relative overflow-hidden"
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Question Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {todayQ.subject}
              </span>
              <span className="text-xs text-[var(--text-muted)]">• Today's Quiz</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award size={13} />
              <span>+{todayQ.points} Points</span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-base md:text-lg font-bold leading-snug text-[var(--text)]">
            {todayQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-2.5 pt-1">
            {todayQ.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isOptionSelected = activeSelected === idx;
              const isOptionCorrect = idx === todayQ.correctIndex;

              let btnClasses =
                'border-[var(--line)] bg-[var(--surface-sunken)] hover:border-amber-500/40 text-[var(--text)]';
              let badgeClasses = 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--line)]';

              if (isAnswered) {
                if (isOptionCorrect) {
                  btnClasses = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold';
                  badgeClasses = 'bg-emerald-500 text-white';
                } else if (isOptionSelected && !isOptionCorrect) {
                  btnClasses = 'border-rose-500 bg-rose-500/10 text-rose-500 line-through';
                  badgeClasses = 'bg-rose-500 text-white';
                } else {
                  btnClasses = 'opacity-50 border-[var(--line)]';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${btnClasses}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${badgeClasses}`}
                  >
                    {letter}
                  </span>
                  <span className="text-xs md:text-sm flex-1 leading-normal">{option}</span>

                  {isAnswered && isOptionCorrect && (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  )}
                  {isAnswered && isOptionSelected && !isOptionCorrect && (
                    <XCircle size={18} className="text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Result & Explanation Box */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fade-in ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {isCorrect ? (
                  <>
                    <Sparkles size={18} className="text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Brilliant! Correct Answer (+{todayQ.points} Spirit Points)
                    </span>
                  </>
                ) : (
                  <>
                    <HelpCircle size={18} className="text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">Learning Moment: Check Explanation Below</span>
                  </>
                )}
              </div>

              <p className="font-medium text-xs text-[var(--text)]">
                {todayQ.explanation}
              </p>

              {todayQ.funFact && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10 text-[11px] text-[var(--text-muted)] flex items-start gap-1.5">
                  <span className="font-bold text-amber-500 shrink-0">💡 Did you know?</span>
                  <span>{todayQ.funFact}</span>
                </div>
              )}
            </div>
          )}

          {/* Countdown & Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>Next question drops tomorrow at 8:00 AM</span>
            </div>
            <Link
              href="/leaderboard"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>View House Leaderboard</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quiz Archive / Additional Questions */}
      <div className="px-4 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <BookOpen size={16} className="text-blue-500" />
          <span>This Week's Knowledge Archive</span>
        </h3>

        <div className="space-y-2">
          {DAILY_QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              className="p-3.5 rounded-2xl border bg-[var(--surface)] flex items-center justify-between text-xs hover:border-amber-500/40 transition-colors"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-amber-500">
                  {q.subject}
                </span>
                <p className="font-semibold text-[var(--text)] line-clamp-1">{q.question}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Correct Answer: {q.options[q.correctIndex]}
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-500 shrink-0 ml-3">
                +{q.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
