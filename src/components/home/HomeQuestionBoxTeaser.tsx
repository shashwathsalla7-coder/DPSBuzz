'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronRight, Sparkles, Trophy, Check, Flame, BrainCircuit, Plus } from 'lucide-react';
import { SchoolFeatures, type DailyQuizQuestion } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export function HomeQuestionBoxTeaser() {
  const [question, setQuestion] = useState<DailyQuizQuestion>(() => SchoolFeatures.getTodayQuestion());
  const [progress, setProgress] = useState(() => SchoolFeatures.getUserQuizProgress());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyAnswered = progress.answeredDates[todayStr];

  useEffect(() => {
    const handleUpdate = () => {
      setQuestion(SchoolFeatures.getTodayQuestion());
      setProgress(SchoolFeatures.getUserQuizProgress());
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, []);

  const handleQuickAnswer = async (index: number) => {
    if (answered || alreadyAnswered) return;
    setSelectedIdx(index);
    setAnswered(true);

    const result = await SchoolFeatures.submitQuizAnswer(question.id, index, username);
    setIsCorrect(result.isCorrect);
    setProgress(SchoolFeatures.getUserQuizProgress());
  };

  const isDone = answered || Boolean(alreadyAnswered);
  const picked = selectedIdx !== null ? selectedIdx : alreadyAnswered?.selectedIndex;
  const correct = answered ? isCorrect : Boolean(alreadyAnswered?.isCorrect);

  return (
    <div className="px-4">
      <div
        className="p-4 rounded-2xl border bg-gradient-to-tr from-[var(--primary-tint)] via-[var(--surface)] to-[var(--gold-tint)] shadow-xs space-y-3 relative overflow-hidden backdrop-blur-xs"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[var(--accent-cta)] to-[var(--accent-cta)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <BrainCircuit size={14} />
            </span>
            <span className="text-xs font-bold text-[var(--text)]">Daily Question Box</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] dark:text-[var(--primary)] border border-[var(--line-strong)] flex items-center gap-1">
              <Sparkles size={10} />
              <span>AI Ranked</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-[var(--gold)]">
              <Flame size={14} className="fill-amber-500" />
              <span>{progress.currentStreak || 0}d Streak</span>
            </div>
            <Link
              href="/question-box"
              className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center"
              title="Submit a question to the AI ranking algorithm"
            >
              <span>+ Submit</span>
            </Link>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">
              Subject: <strong className="text-[var(--text)]">{question.subject}</strong>
            </span>
            {question.difficulty && (
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[var(--gold-tint)] text-[var(--gold)] dark:text-[var(--gold)]">
                {question.difficulty}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm font-semibold text-[var(--text)] leading-snug">
            {question.question}
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {question.options.map((opt, i) => {
            const isPicked = picked === i;
            const isRight = i === question.correctIndex;

            let cls = 'bg-[var(--surface-sunken)] border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)]';
            if (isDone) {
              if (isRight) {
                cls = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
              } else if (isPicked && !isRight) {
                cls = 'bg-[var(--primary-tint)] border-[var(--line-strong)] text-[var(--primary)] line-through';
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
              <span>{correct ? `+${question.points || 10} Spirit Points Recorded in Cloud Database!` : 'Good attempt! Read the AI explanation.'}</span>
            </span>
            <Link
              href="/question-box"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-bold"
            >
              <span>View Full Arena</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
