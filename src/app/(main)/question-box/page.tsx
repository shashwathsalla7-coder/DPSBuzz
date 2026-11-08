'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BrainCircuit,
  Plus,
  Send,
  Check,
  Award,
  BookOpen,
  Filter,
  BarChart3,
  Layers,
} from 'lucide-react';
import { SchoolFeatures, type DailyQuizQuestion } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export default function QuestionBoxPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'submit' | 'pool'>('daily');
  const [todayQ, setTodayQ] = useState<DailyQuizQuestion>(() => SchoolFeatures.getTodayQuestion());
  const [questionsPool, setQuestionsPool] = useState<DailyQuizQuestion[]>(() => SchoolFeatures.getQuestionsPool());
  const [progress, setProgress] = useState(() => SchoolFeatures.getUserQuizProgress());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; points: number } | null>(null);

  // Submit Question State
  const [subSubject, setSubSubject] = useState('Science & Discovery');
  const [subQuestion, setSubQuestion] = useState('');
  const [subOptions, setSubOptions] = useState(['', '', '', '']);
  const [subCorrectIdx, setSubCorrectIdx] = useState(0);
  const [subExplanation, setSubExplanation] = useState('');
  const [subFunFact, setSubFunFact] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [aiEvalResult, setAiEvalResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';
  const fullName = currentUser?.fullName || username;
  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyAnsweredRecord = progress.answeredDates[todayStr];

  useEffect(() => {
    // Sync live database questions & progress on mount
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setTodayQ(SchoolFeatures.getTodayQuestion());
      setQuestionsPool(SchoolFeatures.getQuestionsPool());
      setProgress(SchoolFeatures.getUserQuizProgress());
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectOption = async (index: number) => {
    if (hasSubmitted || alreadyAnsweredRecord) return;
    setSelectedIdx(index);
    setHasSubmitted(true);

    const result = await SchoolFeatures.submitQuizAnswer(todayQ.id, index, username);
    setFeedback(result);
    setProgress(SchoolFeatures.getUserQuizProgress());
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...subOptions];
    updated[idx] = val;
    setSubOptions(updated);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subQuestion.trim() || subOptions.some((o) => !o.trim()) || !subExplanation.trim()) {
      showToast('Please fill out the question, all 4 options, and the explanation.');
      return;
    }

    setIsSubmittingQuestion(true);
    setAiEvalResult(null);

    try {
      const res = await SchoolFeatures.submitQuestionToAI({
        question: subQuestion.trim(),
        subject: subSubject,
        options: subOptions.map((o) => o.trim()),
        correctIndex: subCorrectIdx,
        explanation: subExplanation.trim(),
        funFact: subFunFact.trim(),
        authorUsername: username,
        authorName: fullName,
      });

      if (res.success && res.aiRank) {
        setAiEvalResult(res.aiRank);
        showToast('Question successfully evaluated and saved to database! 🧠✨');
        // Reset form
        setSubQuestion('');
        setSubOptions(['', '', '', '']);
        setSubExplanation('');
        setSubFunFact('');
        setQuestionsPool(SchoolFeatures.getQuestionsPool());
      } else {
        showToast(res.error || 'Failed to submit question to AI ranker.');
      }
    } catch {
      showToast('Error connecting to ranking algorithm.');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const isAnswered = hasSubmitted || Boolean(alreadyAnsweredRecord);
  const activeSelected = selectedIdx !== null ? selectedIdx : alreadyAnsweredRecord?.selectedIndex;
  const isCorrect = feedback ? feedback.isCorrect : Boolean(alreadyAnsweredRecord?.isCorrect);

  return (
    <div className="space-y-4 pb-24 select-none max-w-3xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
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
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--line-strong)] flex items-center gap-1">
              <Sparkles size={11} />
              <span>AI Arena</span>
            </span>
          </div>
        </div>

        {/* Streak & Points Pill */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--gold-tint)] text-[var(--gold)] border border-[var(--gold)]">
            <Flame size={14} className="fill-amber-500" />
            <span>{progress.currentStreak || 0}d Streak</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Trophy size={14} />
            <span>+{progress.totalPointsWon || 0} pts</span>
          </div>
        </div>
      </div>

      {/* High-Tech AI Navigation Tabs */}
      <div className="px-4">
        <div
          className="flex p-1 rounded-2xl border text-xs font-bold gap-1"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-[var(--accent-cta)] to-[var(--accent-cta)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <BrainCircuit size={14} />
            <span>Daily Challenge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-gradient-to-r from-[var(--accent-cta)] to-[var(--accent-cta)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Plus size={14} />
            <span>Submit to AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pool')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pool'
                ? 'bg-gradient-to-r from-[var(--accent-cta)] to-[var(--accent-cta)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Layers size={14} />
            <span>AI Bank ({questionsPool.length})</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DAILY QUESTION OF THE DAY */}
      {/* ==================================================================== */}
      {activeTab === 'daily' && (
        <div className="px-4 space-y-4 animate-fade-in">
          <div
            className="p-5 rounded-3xl border bg-[var(--surface)] shadow-md space-y-4 relative overflow-hidden backdrop-blur-xs"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-tint)] rounded-full blur-2xl pointer-events-none" />

            {/* Question Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-[var(--primary-tint)] text-[var(--primary)] dark:text-[var(--primary)] border border-[var(--line-strong)]">
                  {todayQ.subject}
                </span>
                {todayQ.aiRankScore && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    AI Score: {todayQ.aiRankScore}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--gold)]">
                <Award size={15} />
                <span>+{todayQ.points} House Points</span>
              </div>
            </div>

            {/* Question Text */}
            <h2 className="text-sm md:text-base font-bold text-[var(--text)] leading-relaxed">
              {todayQ.question}
            </h2>

            {/* 4 Interactive Options */}
            <div className="space-y-2.5 pt-1">
              {todayQ.options.map((option, idx) => {
                const isSelected = activeSelected === idx;
                const isCorrectAnswer = idx === todayQ.correctIndex;

                let btnCls = 'bg-[var(--surface-sunken)] border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--text)]';
                let indicatorCls = 'bg-[var(--surface)] border-[var(--line)] text-[var(--text-muted)]';

                if (isAnswered) {
                  if (isCorrectAnswer) {
                    btnCls = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                    indicatorCls = 'bg-emerald-500 text-white border-emerald-500';
                  } else if (isSelected && !isCorrectAnswer) {
                    btnCls = 'bg-[var(--primary-tint)] border-[var(--line-strong)] text-[var(--primary)] dark:text-[var(--primary)] line-through';
                    indicatorCls = 'bg-[var(--accent-cta)] text-white border-[var(--line-strong)]';
                  } else {
                    btnCls = 'opacity-40 border-[var(--line)] text-[var(--text-muted)]';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${btnCls}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${indicatorCls}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs md:text-sm font-medium leading-snug">{option}</span>
                    </div>

                    {isAnswered && isCorrectAnswer && (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrectAnswer && (
                      <XCircle size={18} className="text-[var(--primary)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback & Explanation Card */}
            {isAnswered && (
              <div className="space-y-3 pt-3 border-t border-[var(--line)] animate-fade-in">
                <div
                  className={`p-4 rounded-2xl border ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-[var(--primary-tint)] border-[var(--line-strong)] text-[var(--primary)] dark:text-[var(--primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs mb-1">
                    {isCorrect ? (
                      <>
                        <Sparkles size={16} />
                        <span>Correct Answer! +{todayQ.points} Spirit Points Recorded in Cloud Database!</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        <span>Incorrect option selected. Learn from the explanation below!</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed mt-1">
                    {todayQ.explanation}
                  </p>
                </div>

                {todayQ.funFact && (
                  <div className="p-3.5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text-muted)] space-y-1">
                    <span className="font-bold text-[var(--gold)] flex items-center gap-1.5">
                      💡 Did You Know?
                    </span>
                    <p className="leading-relaxed text-[var(--text)]">{todayQ.funFact}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SUBMIT QUESTION & RUN AI RANKING ALGORITHM */}
      {/* ==================================================================== */}
      {activeTab === 'submit' && (
        <div className="px-4 space-y-4 animate-fade-in">
          {/* AI Rank Result Showcase */}
          {aiEvalResult && (
            <div className="p-4 rounded-2xl border bg-gradient-to-br from-[var(--primary-tint)] via-[var(--primary-tint)] to-emerald-500/10 border-[var(--line-strong)] shadow-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    AI Evaluation & Algorithmic Ranking Report
                  </h3>
                </div>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[var(--accent-cta)] text-white">
                  Score: {aiEvalResult.aiRankScore}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Difficulty</span>
                  <strong className="uppercase font-extrabold text-[var(--gold)]">{aiEvalResult.difficulty}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">Bloom Level</span>
                  <strong className="font-bold text-blue-500 truncate block">{aiEvalResult.bloomLevel}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">House Bounty</span>
                  <strong className="font-extrabold text-emerald-500">+{aiEvalResult.points} pts</strong>
                </div>
              </div>

              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check size={14} />
                <span>+20 Spirit Points awarded to your profile! Question is live in the Cloud Database.</span>
              </p>
            </div>
          )}

          {/* Submission Form */}
          <form
            onSubmit={handleQuestionSubmit}
            className="p-5 rounded-3xl border bg-[var(--surface)] shadow-md space-y-4"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                <BrainCircuit size={16} className="text-[var(--primary)]" />
                <span>Submit an Academic Challenge to the AI Ranker</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Your question will be automatically scored for curriculum rigor, classified by difficulty, and queued for the school-wide Daily Question Box!
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Subject *</label>
                <select
                  value={subSubject}
                  onChange={(e) => setSubSubject(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <option value="Science & Discovery">Science & Discovery</option>
                  <option value="Mathematics & Logic">Mathematics & Logic</option>
                  <option value="General Knowledge & Heritage">General Knowledge & Heritage</option>
                  <option value="English & Literature">English & Literature</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Computer Science & AI">Computer Science & AI</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Question Prompt *</label>
                <textarea
                  required
                  rows={3}
                  value={subQuestion}
                  onChange={(e) => setSubQuestion(e.target.value)}
                  placeholder="e.g. Which layer of the Earth's atmosphere contains the ozone layer that protects us from ultraviolet rays?"
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--line-strong)] leading-relaxed"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold block text-[var(--text)]">
                  4 Multiple Choice Options (Select radio for Correct Answer) *
                </label>
                {subOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={subCorrectIdx === i}
                      onChange={() => setSubCorrectIdx(i)}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--line-strong)] cursor-pointer"
                    />
                    <span className="w-5 text-[11px] font-bold text-[var(--text-muted)]">
                      {String.fromCharCode(65 + i)}:
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--line-strong)]"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Explanation & Scientific Reasoning *</label>
                <textarea
                  required
                  rows={3}
                  value={subExplanation}
                  onChange={(e) => setSubExplanation(e.target.value)}
                  placeholder="Explain why the selected option is correct so students learn from it..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--line-strong)] leading-relaxed"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Did You Know? Fun Fact (Optional)</label>
                <input
                  type="text"
                  value={subFunFact}
                  onChange={(e) => setSubFunFact(e.target.value)}
                  placeholder="e.g. The ozone layer absorbs 97 to 99 percent of the Sun's medium-frequency UV light!"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingQuestion}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-cta)] to-[var(--accent-cta)] text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Sparkles size={15} />
              <span>{isSubmittingQuestion ? 'AI Evaluating & Storing...' : 'Run AI Ranking & Publish to Cloud Database'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: COMMUNITY AI QUESTION BANK */}
      {/* ==================================================================== */}
      {activeTab === 'pool' && (
        <div className="px-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span>Database Question Queue ({questionsPool.length})</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              🟢 Ranked by DPS Algorithm
            </span>
          </div>

          <div className="space-y-3">
            {questionsPool.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border bg-[var(--surface)] shadow-2xs space-y-2.5 hover:border-[var(--line-strong)] transition-all"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary-tint)] text-[var(--primary)] dark:text-[var(--primary)]">
                      {q.subject}
                    </span>
                    {q.difficulty && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[var(--gold-tint)] text-[var(--gold)] dark:text-[var(--gold)]">
                        {q.difficulty}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    AI Score: {q.aiRankScore || 90}%
                  </span>
                </div>

                <h3 className="text-xs md:text-sm font-semibold text-[var(--text)] leading-snug">
                  {q.question}
                </h3>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-1.5 rounded-lg border text-left truncate ${
                        i === q.correctIndex
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'border-[var(--line)] bg-[var(--surface-sunken)]'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}: {opt}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--line)] text-[11px] text-[var(--text-muted)]">
                  <span>Author: <strong className="text-[var(--text)]">@{q.authorUsername || 'academic'}</strong></span>
                  <span className="font-bold text-[var(--gold)]">+{q.points || 10} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
