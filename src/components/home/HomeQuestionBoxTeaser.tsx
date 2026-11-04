'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight, Sparkles, Trophy, Check, Flame } from 'lucide-react';
import { SchoolFeatures, type DailyQuizQuestion } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export function HomeQuestionBoxTeaser() {
  const [question, setQuestion] = useState<DailyQuizQuestion>(() => SchoolFeatures.getTodayQuestion());
  const [progress, setProgress] = useState(() => SchoolFeatures.getUserQuizProgress());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyAnswered = progress.answeredDates[todayStr];

  const handleQuickAnswer = (index: number) => {
    if (answered || alreadyAnswered) return;
    setSelectedIdx(index);
    setAnswered(true);
    const result = SchoolFeatures.submitQuizAnswer(question.id, index);
    setIsCorrect(result.isCorrect);
    setProgress(SchoolFeatures.getUserQuizProgress());

    if (result.isCorrect && currentUser?.username) {
      try {
        DataStore.addSpiritPoints(currentUser.username, 10);
      } catch {}
    }
  };

  const isDone = answered || Boolean(alreadyAnswered);
  const picked = selectedIdx !== null ? selectedIdx : alreadyAnswered?.selectedIndex;
  const correct = answered ? isCorrect : Boolean(alreadyAnswered?.isCorrect);

  return (
    <div className="px-4">
      <div
        className="p-4 rounded-2xl border bg-gradient-to-tr from-amber-500/10 via-[var(--surface)] to-emerald-500/5 shadow-2xs space-y-3"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
              ?
            </span>
            <span className="text-xs font-bold text-[var(--text)]">Daily Question Box</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
              {question.subject}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
            <Flame size={14} className="fill-amber-500" />
            <span>{progress.currentStreak}d Streak</span>
          </div>
        </div>

        <p className="text-xs md:text-sm font-semibold text-[var(--text)] leading-snug">
          {question.question}
        </p>

        {/* 2x2 Quick Option Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {question.options.map((opt, i) => {
            const isPicked = picked === i;
            const isRight = i === question.correctIndex;

            let cls = 'bg-[var(--surface-sunken)] border-[var(--line)] hover:border-amber-500/40 text-[var(--text)]';
            if (isDone) {
              if (isRight) {
                cls = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (isPicked && !isRight) {
                cls = 'bg-rose-500/10 border-rose-500 text-rose-500 line-through';
              } else {
                cls = 'opacity-50 border-[var(--line)]';
              }
            }

            return (
              <button
                key={i}
                type="button"
                disabled={isDone}
                onClick={() => handleQuickAnswer(i)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${cls}`}
              >
                <span className="w-5 h-5 rounded-md bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="truncate flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {isDone && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--line)]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles size={13} />
              <span>{correct ? '+10 Spirit Points Awarded!' : 'Great attempt! Keep learning.'}</span>
            </span>
            <Link
              href="/question-box"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>Read explanation</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
