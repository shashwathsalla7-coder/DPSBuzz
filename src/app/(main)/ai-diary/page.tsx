'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Calendar,
  Bus,
  Shirt,
  GraduationCap,
  RotateCcw,
  Clock,
  CheckCircle2,
  BrainCircuit,
  Award,
  Flame,
  Check,
  ListTodo,
} from 'lucide-react';
import { SchoolFeatures, type DailyStudySchedule, type StudyScheduleItem } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
  scheduleData?: DailyStudySchedule;
}

export default function AiDiaryPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'scheduler'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "👋 Namaste! I am your **DPS Buzz AI Diary Assistant**.\n\nI have access to daily homework diaries, the examination timetable, uniform guidelines, and Madam's official announcements for Nursery to Class 10.\n\nI can also **automatically structure your personalized Daily Study Schedule** with Pomodoro focus intervals!\n\nHow can I help you today?",
      timestamp: 'Just now',
      suggestions: [
        "Plan my daily study schedule",
        "What is today's homework?",
        'What is tomorrow uniform?',
        'Upcoming exam timetable',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Study Scheduler State
  const [targetHours, setTargetHours] = useState(2.5);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Science']);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<DailyStudySchedule | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<DailyStudySchedule[]>(() => SchoolFeatures.getUserStudySchedules());
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';
  const userClass = currentUser?.class || '8';

  useEffect(() => {
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      const scheds = SchoolFeatures.getUserStudySchedules();
      setSavedSchedules(scheds);
      if (scheds.length > 0 && !currentSchedule) {
        setCurrentSchedule(scheds[0]);
      }
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username, currentSchedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    const q = text.toLowerCase();

    // If query asks for study plan, generate live schedule via AI
    if (q.includes('schedule') || q.includes('plan') || q.includes('study routine') || q.includes('timetable')) {
      try {
        const schedule = await SchoolFeatures.generateStudySchedule({
          username,
          grade: userClass,
          subjects: ['Mathematics', 'Science', 'English'],
          targetHours: 2.5,
        });

        if (schedule) {
          setCurrentSchedule(schedule);
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `✨ **Personalized AI Daily Study Schedule Generated!**\n\nI have calculated optimal study intervals with Pomodoro breaks based on your Class ${userClass} syllabus. This plan has been saved to your cloud database account.`,
            timestamp: 'Just now',
            scheduleData: schedule,
            suggestions: ["What is today's homework?", 'Uniform schedule', 'Upcoming exams'],
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      } catch {}
    }

    // Default fast AI response
    setTimeout(() => {
      const response = SchoolFeatures.queryAiDiary(text, userClass);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        timestamp: 'Just now',
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleGenerateManualSchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const sched = await SchoolFeatures.generateStudySchedule({
        username,
        grade: userClass,
        subjects: selectedSubjects,
        targetHours,
      });
      if (sched) {
        setCurrentSchedule(sched);
        showToast('AI Study Schedule generated and persisted to database! 🧠📅');
      }
    } catch {
      showToast('Error generating schedule.');
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    const isNowDone = !completedTasks[taskId];
    setCompletedTasks((prev) => ({ ...prev, [taskId]: isNowDone }));
    if (isNowDone) {
      showToast('Task completed! +5 Spirit Points awarded for discipline! 🌟');
      try {
        DataStore.addSpiritPoints(username, 5);
      } catch {}
    }
  };

  const toggleSubjectFilter = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `Chat reset. I am ready to help with **Class ${userClass}** homework, daily study schedules, or school timetables!`,
        timestamp: 'Just now',
        suggestions: [
          'Plan my daily study schedule',
          "What is today's homework?",
          'Uniform schedule',
        ],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1rem)] max-w-3xl mx-auto select-none bg-[var(--surface)] text-[var(--text)]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header with AI Glow */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b shrink-0 backdrop-blur-md sticky top-0 z-20"
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm font-bold">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight">AI Diary Copilot</h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Live Cloud
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Curriculum AI • Class {userClass}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] rounded-full transition-colors cursor-pointer"
          title="Reset chat"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Mode Switcher: AI Chat vs AI Daily Study Scheduler */}
      <div className="px-4 py-2 border-b shrink-0" style={{ borderColor: 'var(--line)' }}>
        <div
          className="flex p-1 rounded-2xl border text-xs font-bold gap-1"
          style={{
            backgroundColor: 'var(--surface-sunken)',
            borderColor: 'var(--line)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Bot size={14} />
            <span>AI Diary Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduler')}
            className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'scheduler'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <Calendar size={14} />
            <span>AI Study Scheduler</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: AI DIARY CHAT */}
      {/* ==================================================================== */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
          {/* Quick Category Chips */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto no-scrollbar shrink-0 text-xs"
            style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-sunken)' }}
          >
            <button
              type="button"
              onClick={() => handleSend('Plan my daily study schedule')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold shrink-0 hover:border-violet-500 transition-colors shadow-2xs"
            >
              <Sparkles size={13} />
              <span>📅 Plan Study Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend("What is today's homework?")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-amber-500/50 transition-colors shadow-2xs"
            >
              <BookOpen size={13} className="text-amber-500" />
              <span>Class {userClass} Diary</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('What is tomorrow uniform?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-blue-500/50 transition-colors shadow-2xs"
            >
              <Shirt size={13} className="text-blue-500" />
              <span>Uniform Guide</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Upcoming examination schedule')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-purple-500/50 transition-colors shadow-2xs"
            >
              <Calendar size={13} className="text-purple-500" />
              <span>Exam Timetable</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('What are the school bus timings?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-emerald-500/50 transition-colors shadow-2xs"
            >
              <Bus size={13} className="text-emerald-500" />
              <span>Bus Timings</span>
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles size={15} />
                  </div>
                )}

                <div className="space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-[var(--surface-sunken)] border text-[var(--text)] rounded-tl-xs shadow-2xs'
                    }`}
                    style={msg.sender === 'ai' ? { borderColor: 'var(--line)' } : {}}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Inline Interactive Schedule Card */}
                    {msg.scheduleData && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            <span>{msg.scheduleData.grade} Daily Focus Plan</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10">
                            {msg.scheduleData.totalDurationMin} mins
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.scheduleData.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-2 rounded-lg bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-between gap-2 text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-500 shrink-0">{item.timeBlock}</span>
                                <span className="truncate">{item.task}</span>
                              </div>
                              <span
                                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                  item.priority === 'urgent'
                                    ? 'bg-rose-500/10 text-rose-500'
                                    : 'bg-blue-500/10 text-blue-500'
                                }`}
                              >
                                {item.subject}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(s)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--surface)] border border-[var(--line)] hover:border-violet-500/50 hover:text-violet-600 transition-colors shadow-2xs"
                        >
                          {s} &rarr;
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <span>AI analyzing curriculum and database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--line)' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask for homework, generate study schedule, exam timetable..."
                className="flex-1 h-11 px-4 rounded-full border bg-[var(--surface-sunken)] text-xs md:text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                style={{ borderColor: 'var(--line)' }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: AI DAILY STUDY SCHEDULER */}
      {/* ==================================================================== */}
      {activeTab === 'scheduler' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in">
          {/* Planner Controls Card */}
          <div
            className="p-5 rounded-3xl border bg-[var(--surface)] shadow-md space-y-4"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <BrainCircuit size={17} className="text-violet-500" />
                <span>AI Spaced-Repetition Study Engine</span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Generates a scientifically balanced evening revision routine with Pomodoro focus blocks and breaks. Stored permanently in your Cloud Database!
              </p>
            </div>

            {/* Target Hours Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold block text-[var(--text)]">
                Target Study Duration: <strong className="text-violet-500">{targetHours} Hours</strong>
              </label>
              <div className="flex gap-2">
                {[1.5, 2.0, 2.5, 3.0, 4.0].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setTargetHours(hrs)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      targetHours === hrs
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Subjects Filter Chips */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold block text-[var(--text)]">Priority Subjects to Include:</label>
              <div className="flex flex-wrap gap-1.5">
                {['Mathematics', 'Science', 'Social Science', 'English', 'Computer Science'].map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubjectFilter(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold'
                          : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingSchedule}
              onClick={handleGenerateManualSchedule}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Sparkles size={15} />
              <span>{isGeneratingSchedule ? 'Calculating Algorithm...' : '✨ Generate AI Optimized Study Schedule'}</span>
            </button>
          </div>

          {/* Active Schedule Display */}
          {currentSchedule && (
            <div
              className="p-5 rounded-3xl border bg-[var(--surface)] shadow-md space-y-4 animate-fade-in"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                    <ListTodo size={16} className="text-emerald-500" />
                    <span>Today's Active Schedule ({currentSchedule.grade})</span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Total Focus Time: {currentSchedule.totalDurationMin} minutes • Cloud Synced
                  </p>
                </div>

                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {Object.values(completedTasks).filter(Boolean).length} / {currentSchedule.items.length} Done
                </span>
              </div>

              {/* Time Blocks List */}
              <div className="space-y-2.5">
                {currentSchedule.items.map((item) => {
                  const isDone = Boolean(completedTasks[item.id]);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleTaskCompletion(item.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30 opacity-75'
                          : 'bg-[var(--surface-sunken)] border-[var(--line)] hover:border-violet-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[var(--surface)] border-[var(--line)]'
                          }`}
                        >
                          {isDone && <Check size={14} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                              {item.timeBlock}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                item.priority === 'urgent'
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-blue-500/10 text-blue-500'
                              }`}
                            >
                              {item.subject}
                            </span>
                          </div>
                          <p
                            className={`text-xs mt-0.5 font-medium leading-snug ${
                              isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'
                            }`}
                          >
                            {item.task}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-amber-500 shrink-0">
                        {item.durationMin}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
