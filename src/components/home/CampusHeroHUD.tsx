'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  Volume2,
  VolumeX,
  Check,
  Plus,
  X,
  Sparkles,
  Trophy,
  BrainCircuit,
  MessageCircle,
  Bot,
  BookOpen,
  Search,
  ChevronRight,
  Flame,
  Clock,
  Radio,
  Send,
  Award,
} from 'lucide-react';
import { SchoolFeatures, type PrincipalBroadcast, type DailyQuizQuestion } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

function getCurrentSchoolPeriod(): { period: string; isRecess: boolean; subtitle: string } {
  if (typeof window === 'undefined') {
    return { period: 'Campus Active', isRecess: false, subtitle: 'Digital Assembly' };
  }
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMins = hours * 60 + minutes;

  if (day === 0) {
    return { period: 'Sunday Prep', isRecess: false, subtitle: 'Self Study & Weekly Review' };
  }
  if (totalMins < 480) {
    return { period: 'Pre-Campus Hours', isRecess: false, subtitle: 'Gates Open at 8:00 AM' };
  }
  if (totalMins >= 480 && totalMins < 510) {
    return { period: 'Morning Assembly & Roll Call', isRecess: false, subtitle: 'Zero Period • Classrooms' };
  }
  if (totalMins >= 510 && totalMins < 555) {
    return { period: 'Period 1 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 555 && totalMins < 600) {
    return { period: 'Period 2 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 600 && totalMins < 645) {
    return { period: 'Period 3 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 645 && totalMins < 665) {
    return { period: 'Short Recess 🥪', isRecess: true, subtitle: 'Courtyard & Refreshments' };
  }
  if (totalMins >= 665 && totalMins < 710) {
    return { period: 'Period 4 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 710 && totalMins < 755) {
    return { period: 'Period 5 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 755 && totalMins < 795) {
    return { period: 'Lunch Break 🍱', isRecess: true, subtitle: 'Dining Hall & Ground' };
  }
  if (totalMins >= 795 && totalMins < 840) {
    return { period: 'Period 6 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 840 && totalMins < 885) {
    return { period: 'Period 7 • In Session', isRecess: false, subtitle: 'Academic Block' };
  }
  if (totalMins >= 885 && totalMins < 915) {
    return { period: 'Period 8 • Dispersal Prep', isRecess: false, subtitle: 'Buses Lining Up' };
  }
  return { period: 'Campus Active • Study Hours', isRecess: false, subtitle: 'AI Diary & Homework Sync' };
}

function getGreeting(name: string): string {
  const hr = new Date().getHours();
  const displayName = name ? name.split(' ')[0] : 'Student';
  if (hr < 12) return `Good morning, ${displayName}`;
  if (hr < 17) return `Good afternoon, ${displayName}`;
  return `Good evening, ${displayName}`;
}

const HOUSES = [
  { id: 'ganges', name: 'Ganges House', color: '#2B4BFF', badge: '🌊', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  { id: 'yamuna', name: 'Yamuna House', color: '#F59E0B', badge: '⚡', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  { id: 'kaveri', name: 'Kaveri House', color: '#10B981', badge: '🍃', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  { id: 'krishna', name: 'Krishna House', color: '#EF4444', badge: '🔥', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', border: 'border-rose-500/30' },
];

export function CampusHeroHUD() {
  const [activeTab, setActiveTab] = useState<'circular' | 'houses' | 'quiz'>('circular');
  const [broadcasts, setBroadcasts] = useState<PrincipalBroadcast[]>(() => SchoolFeatures.getBroadcasts());
  const [question, setQuestion] = useState<DailyQuizQuestion>(() => SchoolFeatures.getTodayQuestion());
  const [progress, setProgress] = useState(() => SchoolFeatures.getUserQuizProgress());
  const [periodInfo, setPeriodInfo] = useState(() => getCurrentSchoolPeriod());
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [isAcknowledgeSaving, setIsAcknowledgeSaving] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAudience, setNewAudience] = useState<'all' | 'nursery_5' | 'seniors_6_10' | 'teachers'>('all');
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'normal'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Quiz state
  const [selectedQuizIdx, setSelectedQuizIdx] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';
  const userFullName = currentUser?.fullName || username;
  const userClass = currentUser?.class ? `Class ${currentUser.class}` : 'Campus Student';

  // Determine user's house
  const userHouse = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash * 31 + username.charCodeAt(i)) % HOUSES.length;
    }
    return HOUSES[Math.abs(hash)];
  }, [username]);

  // House Points Standings
  const houseStandings = useMemo(() => {
    const bonus = progress.totalPointsWon || 0;
    return [
      { ...HOUSES[0], points: 1480 + (userHouse.id === 'ganges' ? bonus : 0), rank: 1 },
      { ...HOUSES[1], points: 1420 + (userHouse.id === 'yamuna' ? bonus : 0), rank: 2 },
      { ...HOUSES[2], points: 1390 + (userHouse.id === 'kaveri' ? bonus : 0), rank: 3 },
      { ...HOUSES[3], points: 1350 + (userHouse.id === 'krishna' ? bonus : 0), rank: 4 },
    ].sort((a, b) => b.points - a.points);
  }, [progress.totalPointsWon, userHouse.id]);

  useEffect(() => {
    // Sync broadcasts and quiz progress with Cloudflare D1 SQL / Supabase
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setBroadcasts(SchoolFeatures.getBroadcasts());
      setQuestion(SchoolFeatures.getTodayQuestion());
      setProgress(SchoolFeatures.getUserQuizProgress());
    };

    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);

    // Period ticker every 60 seconds
    const interval = setInterval(() => {
      setPeriodInfo(getCurrentSchoolPeriod());
    }, 60000);

    return () => {
      window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
      clearInterval(interval);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [username]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const latestBroadcast = broadcasts.length > 0 ? broadcasts[0] : null;
  const isAcknowledged = latestBroadcast
    ? (latestBroadcast.acknowledgedBy || []).includes(username)
    : false;

  // Speech synthesis toggle
  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Speech audio is not supported in this browser.');
      return;
    }

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    const textToSpeak = latestBroadcast
      ? `Official announcement from the Office of the Principal. ${latestBroadcast.title}. ${latestBroadcast.message}`
      : 'Office of the Principal. DPS Digital Campus Hub is live and active.';

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Google'))) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) utterance.voice = englishVoice;

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
  };

  const handleAcknowledge = async () => {
    if (!latestBroadcast || isAcknowledged || isAcknowledgeSaving) return;
    setIsAcknowledgeSaving(true);
    try {
      await SchoolFeatures.acknowledgeBroadcast(latestBroadcast.id, username);
      setBroadcasts(SchoolFeatures.getBroadcasts());
      showToast('Circular acknowledged! Saved to school registry.');
    } catch {
      showToast('Error acknowledging notice.');
    } finally {
      setIsAcknowledgeSaving(false);
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await SchoolFeatures.createBroadcast({
        title: newTitle,
        message: newMessage,
        targetAudience: newAudience,
        priority: newPriority,
      });
      setBroadcasts(SchoolFeatures.getBroadcasts());
      setIsComposeOpen(false);
      setNewTitle('');
      setNewMessage('');
      showToast('Circular published campus-wide! 🎓');
    } catch {
      showToast('Error publishing broadcast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyAnswered = progress.answeredDates?.[todayStr];

  const handleAnswerQuiz = async (idx: number) => {
    if (quizAnswered || alreadyAnswered) return;
    setSelectedQuizIdx(idx);
    setQuizAnswered(true);

    const res = await SchoolFeatures.submitQuizAnswer(question.id, idx, username);
    setQuizIsCorrect(res.isCorrect);
    setProgress(SchoolFeatures.getUserQuizProgress());
    showToast(res.isCorrect ? 'Correct! +10 Points added to your House! 🎉' : 'Nice try! Review the explanation.');
  };

  const isMadamOrAdmin =
    username.toLowerCase() === 'admin' ||
    username.toLowerCase() === 'madam' ||
    username.toLowerCase().includes('principal') ||
    username.toLowerCase() === 'shashwath71845';

  return (
    <section className="px-4 pt-1 pb-3 select-none" aria-label="Campus Command Center">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Unified Campus Command Island */}
      <div
        className="rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        {/* Top Status Strip: Real-time School Pulse & Personalized Identity */}
        <div
          className="px-3.5 py-2.5 border-b flex items-center justify-between gap-2 flex-wrap"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          {/* Greeting & Student Class */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-7 h-7 rounded-lg ${userHouse.bg} ${userHouse.border} border flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs`}
              title={`${userHouse.name} Member`}
            >
              {userHouse.badge}
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-[var(--text)] truncate leading-tight">
                {getGreeting(userFullName)}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1.5">
                <span>{userClass}</span>
                <span>•</span>
                <span className="font-semibold text-[var(--primary)]">{userHouse.name}</span>
              </p>
            </div>
          </div>

          {/* Live School Bell / Period Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-all ${
                periodInfo.isRecess
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${periodInfo.isRecess ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span>{periodInfo.period}</span>
            </div>
          </div>
        </div>

        {/* Segmented Control Bar: 3 Tabs (Principal's Desk, House Standings, Brain Teaser) */}
        <div
          className="p-1.5 mx-3 mt-3 rounded-xl flex items-center gap-1 border"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'circular'}
            onClick={() => setActiveTab('circular')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'circular'
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{
              borderColor: activeTab === 'circular' ? 'var(--line)' : 'transparent',
            }}
          >
            <GraduationCap size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">Principal&apos;s Desk</span>
            {latestBroadcast && !isAcknowledged && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'houses'}
            onClick={() => setActiveTab('houses')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'houses'
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{
              borderColor: activeTab === 'houses' ? 'var(--line)' : 'transparent',
            }}
          >
            <Trophy size={13} className="text-blue-500 shrink-0" />
            <span className="truncate">House Standings</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quiz'}
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{
              borderColor: activeTab === 'quiz' ? 'var(--line)' : 'transparent',
            }}
          >
            <BrainCircuit size={13} className="text-violet-500 shrink-0" />
            <span className="truncate">Daily Challenge</span>
            {progress.currentStreak > 0 && (
              <span className="text-[9px] font-extrabold text-amber-500 flex items-center shrink-0">
                <Flame size={10} className="fill-amber-500" />
                {progress.currentStreak}d
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Principal Madam's Live Dispatch & Voice Synthesizer */}
        {activeTab === 'circular' && (
          <div className="p-3.5 space-y-3 animate-fade-in">
            {latestBroadcast ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {latestBroadcast.senderAvatar ? (
                        <img
                          src={latestBroadcast.senderAvatar}
                          alt={latestBroadcast.sender}
                          className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/40 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-xs border-2 border-amber-500/40">
                          <GraduationCap size={18} />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-2xs">
                        <ShieldCheck size={10} strokeWidth={2.5} />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-[var(--text)] truncate">
                          {latestBroadcast.sender}
                        </h3>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Official Circular
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {latestBroadcast.title} • {latestBroadcast.date}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header: Speech Audio & Madam Compose */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleSpeech}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isPlayingSpeech
                          ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                          : 'bg-[var(--surface-sunken)] hover:bg-[var(--primary)] hover:text-white text-[var(--text)] border-[var(--line)]'
                      }`}
                      title={isPlayingSpeech ? 'Stop speech audio' : "Listen to Madam Principal's Address"}
                    >
                      {isPlayingSpeech ? (
                        <>
                          <VolumeX size={13} />
                          <span className="animate-pulse">Speaking...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} className="text-amber-500" />
                          <span>Listen 🔊</span>
                        </>
                      )}
                    </button>

                    {isMadamOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsComposeOpen(true)}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="Publish new principal broadcast"
                      >
                        <Plus size={13} strokeWidth={3} />
                        <span className="hidden sm:inline">Dispatch</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Circular Message Box */}
                <div
                  className="p-3 rounded-xl border text-xs leading-relaxed text-[var(--text)] relative"
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <p className="font-semibold mb-1 text-[var(--text)]">{latestBroadcast.title}</p>
                  <p className="text-[var(--text-muted)] text-[11px] whitespace-pre-line line-clamp-3">
                    {latestBroadcast.message}
                  </p>

                  {/* Equalizer animation when speaking */}
                  {isPlayingSpeech && (
                    <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] text-amber-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Radio size={12} className="animate-pulse" />
                        <span>Live Voice Synthesis • Audio Broadcast Playing</span>
                      </span>
                      <span className="tracking-widest animate-pulse">lıllılı.ıllı</span>
                    </div>
                  )}
                </div>

                {/* Footer Strip: Direct Action & Acknowledge */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                  <Link
                    href="/notices"
                    className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>View All School Circulars</span>
                    <ChevronRight size={12} />
                  </Link>

                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    disabled={isAcknowledged || isAcknowledgeSaving}
                    className={`px-3 py-1.5 rounded-full font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAcknowledged
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-[var(--primary)] text-white hover:opacity-90 shadow-2xs'
                    }`}
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>{isAcknowledged ? 'Acknowledged ✓' : 'Acknowledge Receipt'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div
                className="p-4 rounded-xl border text-center space-y-2"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <div className="w-9 h-9 rounded-full mx-auto bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text)]">Office of the Principal</h4>
                <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                  No active emergency circulars. Regular school timetable and assembly guidelines apply.
                </p>
                {isMadamOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(true)}
                    className="mt-1 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full hover:opacity-90 transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>+ Publish Circular</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Inter-House Spirit Standings */}
        {activeTab === 'houses' && (
          <div className="p-3.5 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-500" />
                <span>Inter-House Championship 2026–27</span>
              </span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                Your House: <strong className="text-[var(--text)]">{userHouse.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {houseStandings.map((h) => {
                const isMyHouse = h.id === userHouse.id;
                return (
                  <div
                    key={h.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isMyHouse
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-2xs'
                        : 'border-[var(--line)] bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm">{h.badge}</span>
                        <span className="text-xs font-bold text-[var(--text)] truncate">
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)]">
                        #{h.rank}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-[var(--text-muted)]">Points:</span>
                      <span className="font-bold text-[var(--text)] tabular-nums">{h.points} pts</span>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full h-1.5 rounded-full bg-[var(--line)] mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (h.points / 1600) * 100)}%`,
                          backgroundColor: h.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Daily Brain Teaser */}
        {activeTab === 'quiz' && (
          <div className="p-3.5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <BrainCircuit size={14} className="text-violet-500" />
                <span className="font-bold text-[var(--text)]">Daily Question Box</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  {question.subject}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <Flame size={13} className="fill-amber-500" />
                <span>+10 pts</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[var(--text)] leading-snug">
              {question.question}
            </p>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {question.options.map((opt, idx) => {
                const isSelected = (selectedQuizIdx !== null ? selectedQuizIdx : alreadyAnswered?.selectedIndex) === idx;
                const isCorrect = idx === question.correctIndex;
                const hasAnswered = quizAnswered || Boolean(alreadyAnswered);

                let btnStyle = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)] hover:border-[var(--primary)]';
                if (hasAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                  } else {
                    btnStyle = 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)] opacity-60';
                  }
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswerQuiz(idx)}
                    disabled={hasAnswered}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                  >
                    <span className="truncate">{opt}</span>
                    {hasAnswered && isCorrect && <Check size={14} className="text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {(quizAnswered || Boolean(alreadyAnswered)) && (
              <div
                className="p-2.5 rounded-xl border text-[11px] leading-relaxed text-[var(--text-muted)] animate-fade-in"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                }}
              >
                <strong className="text-[var(--text)]">Explanation: </strong>
                {question.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sleek Rapid Flight Deck: 4 Direct Action Pills (WhatsApp, AI Diary, Notes, Lost & Found) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
        <Link
          href="/groups"
          className="p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-2.5 hover:border-[var(--primary)] group shadow-2xs"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageCircle size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text)] truncate leading-tight">
              Class WhatsApp
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              Chats & Groups
            </div>
          </div>
        </Link>

        <Link
          href="/ai-diary"
          className="p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-2.5 hover:border-[var(--primary)] group shadow-2xs"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Bot size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text)] truncate leading-tight">
              AI Diary
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              Homework & Rules
            </div>
          </div>
        </Link>

        <Link
          href="/study-corner"
          className="p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-2.5 hover:border-[var(--primary)] group shadow-2xs"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text)] truncate leading-tight">
              Study Corner
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              Notes & Revision
            </div>
          </div>
        </Link>

        <Link
          href="/lost-found"
          className="p-2.5 rounded-xl border transition-all duration-150 flex items-center gap-2.5 hover:border-[var(--primary)] group shadow-2xs"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--line)',
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Search size={17} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[var(--text)] truncate leading-tight">
              Lost & Found
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              Campus Recovery
            </div>
          </div>
        </Link>
      </div>

      {/* Modal: Madam / Admin New Circular Compose Dialog */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-5 space-y-4 shadow-xl animate-scale-up"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Issue Official Circular</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Office of the Principal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text)] block mb-1">
                  Circular Subject / Headline
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Annual Sports Day Schedule & Timetable"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] focus:outline-hidden focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[var(--text)] block mb-1">
                  Announcement Body
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter the official details, instructions, and dates..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] focus:outline-hidden focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)]"
                  >
                    <option value="all">Entire Campus (Nursery–10)</option>
                    <option value="seniors_6_10">Classes 6 to 10</option>
                    <option value="nursery_5">Nursery to Class 5</option>
                    <option value="teachers">Teaching Staff Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)]"
                  >
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Emergency</option>
                    <option value="normal">Normal Information</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish to Campus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
