'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  Camera,
  Upload,
  Maximize2,
  X,
  Trophy,
  Filter,
  Eye,
  Plus,
} from 'lucide-react';
import { SchoolFeatures, type DailyStudySchedule, type StudyScheduleItem, type ClassDiaryEntry } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
  scheduleData?: DailyStudySchedule;
  imageUrl?: string;
  diaryEntry?: ClassDiaryEntry;
  canUploadDiary?: boolean;
  targetClass?: string;
}

export default function AiDiaryPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'diary_wall' | 'scheduler'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "👋 Namaste! I am your **DPS Buzz AI Diary Assistant**.\n\nI have access to **daily class diary photos**, homework tasks, the examination timetable, uniform guidelines, and Madam's official announcements for Nursery to Class 10.\n\nAsk me *\"Show today's diary\"* or *\"What is today's homework?\"* and I will retrieve the verified diary snapshot for your class!\n\n🏆 **Speed Diary Challenge:** The first student in each class to upload today's diary photo wins **+50 House Points**!",
      timestamp: 'Just now',
      suggestions: [
        "Show today's diary image",
        "What is today's homework?",
        'Plan my daily study schedule',
        'What is tomorrow uniform?',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Diary Wall State
  const [diaryEntries, setDiaryEntries] = useState<ClassDiaryEntry[]>(() => SchoolFeatures.getDiaryEntries());
  const [selectedDiaryClass, setSelectedDiaryClass] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('8');
  const [selectedSection, setSelectedSection] = useState('G');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [homeworkNotes, setHomeworkNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const userFullName = currentUser?.fullName || username;
  const userClass = (currentUser?.class || '8').toString().replace(/[^0-9]/g, '') || '8';

  useEffect(() => {
    setSelectedClass(userClass);
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setSavedSchedules(SchoolFeatures.getUserStudySchedules());
      setDiaryEntries(SchoolFeatures.getDiaryEntries());
      const scheds = SchoolFeatures.getUserStudySchedules();
      if (scheds.length > 0 && !currentSchedule) {
        setCurrentSchedule(scheds[0]);
      }
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username, currentSchedule, userClass]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
            suggestions: ["Show today's diary image", "What is today's homework?", 'Uniform schedule', 'Upcoming exams'],
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
        imageUrl: response.imageUrl,
        diaryEntry: response.diaryEntry,
        canUploadDiary: response.canUploadDiary,
        targetClass: response.targetClass,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 350);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid photo file.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select or capture a photo of your diary.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to Cloudinary via /api/upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'diary');

      const upRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const upData = await upRes.json();
      if (!upData.success || !upData.url) {
        showToast(upData.error || 'Failed to upload image.');
        setIsUploading(false);
        return;
      }

      // 2. Save diary entry to Cloudflare D1 SQL via SchoolFeatures
      const res = await SchoolFeatures.uploadDiaryEntry({
        classGrade: selectedClass,
        section: selectedSection,
        imageUrl: upData.url,
        homeworkSummary: homeworkNotes,
        username,
        fullName: userFullName,
      });

      if (res.success) {
        showToast(res.message);
        setIsUploadOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setHomeworkNotes('');
        setDiaryEntries(SchoolFeatures.getDiaryEntries());

        // Notify AI chat with confirmation message
        if (res.isFirstSubmission) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-upload-${Date.now()}`,
              sender: 'ai',
              text: `🎉 **Outstanding! You are the FIRST in Class ${selectedClass} to submit today's diary!**\n\n**+50 House Points** have been awarded to your account and your House! Your snapshot is now officially visible to all classmates.`,
              timestamp: 'Just now',
              imageUrl: upData.url,
              diaryEntry: res.entry,
              suggestions: ['Plan my study schedule', "What is today's homework?"],
            },
          ]);
        }
      } else {
        showToast(res.message || 'Error saving diary entry.');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload error occurred.');
    } finally {
      setIsUploading(false);
    }
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
        text: `Chat reset. I am ready to help with **Class ${userClass}** homework, daily study schedules, or verified diary photos!`,
        timestamp: 'Just now',
        suggestions: [
          "Show today's diary image",
          'Plan my daily study schedule',
          "What is today's homework?",
          'Uniform schedule',
        ],
      },
    ]);
  };

  const filteredDiaryEntries = useMemo(() => {
    if (selectedDiaryClass === 'all') return diaryEntries;
    return diaryEntries.filter((d) => d.classGrade.replace(/[^0-9]/g, '') === selectedDiaryClass);
  }, [diaryEntries, selectedDiaryClass]);

  const todayStr = new Date().toISOString().split('T')[0];
  const hasUserClassUploadedToday = useMemo(() => {
    return diaryEntries.some((d) => d.classGrade.replace(/[^0-9]/g, '') === userClass && d.dateStr === todayStr);
  }, [diaryEntries, userClass, todayStr]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1rem)] max-w-3xl mx-auto select-none bg-[var(--surface)] text-[var(--text)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            title="Upload today's physical diary page"
          >
            <Camera size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Upload Diary</span>
            <span className="text-[10px] bg-black/15 px-1 rounded-sm">+50 pts</span>
          </button>

          <button
            type="button"
            onClick={handleResetChat}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] rounded-full transition-colors cursor-pointer"
            title="Reset chat"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      {/* 3-Tab Segmented Mode Switcher */}
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
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{ borderColor: activeTab === 'chat' ? 'var(--line)' : 'transparent' }}
          >
            <Bot size={14} className="text-violet-500" />
            <span>AI Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diary_wall')}
            className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'diary_wall'
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{ borderColor: activeTab === 'diary_wall' ? 'var(--line)' : 'transparent' }}
          >
            <Camera size={14} className="text-amber-500" />
            <span>Class Diary Wall</span>
            {diaryEntries.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                {diaryEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduler')}
            className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'scheduler'
                ? 'bg-[var(--surface)] text-[var(--text)] border shadow-2xs font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            style={{ borderColor: activeTab === 'scheduler' ? 'var(--line)' : 'transparent' }}
          >
            <Calendar size={14} className="text-blue-500" />
            <span>Study Scheduler</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: AI DIARY CHAT */}
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
              onClick={() => handleSend("Show today's diary image")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold shrink-0 hover:border-amber-500 transition-colors shadow-2xs cursor-pointer"
            >
              <Camera size={13} />
              <span>📸 Class {userClass} Diary Image</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Plan my daily study schedule')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold shrink-0 hover:border-violet-500 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles size={13} />
              <span>📅 Plan Study Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend("What is today's homework?")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-amber-500/50 transition-colors shadow-2xs cursor-pointer"
            >
              <BookOpen size={13} className="text-amber-500" />
              <span>Homework Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('What is tomorrow uniform?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-blue-500/50 transition-colors shadow-2xs cursor-pointer"
            >
              <Shirt size={13} className="text-blue-500" />
              <span>Uniform Guide</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Upcoming examination schedule')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-purple-500/50 transition-colors shadow-2xs cursor-pointer"
            >
              <Calendar size={13} className="text-purple-500" />
              <span>Exam Timetable</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('What are the school bus timings?')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-emerald-500/50 transition-colors shadow-2xs cursor-pointer"
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
                className={`flex gap-3 max-w-[92%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Sparkles size={15} />
                  </div>
                )}

                <div className="space-y-2 max-w-full">
                  <div
                    className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[var(--primary)] text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-[var(--surface-sunken)] border text-[var(--text)] rounded-tl-xs shadow-2xs'
                    }`}
                    style={msg.sender === 'ai' ? { borderColor: 'var(--line)' } : {}}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Inline Physical Diary Image Card */}
                    {msg.imageUrl && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <Camera size={14} />
                            <span>Class {msg.diaryEntry?.classGrade || userClass} Diary Page</span>
                          </span>
                          {msg.diaryEntry?.isFirstSubmission && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-extrabold flex items-center gap-1">
                              <Trophy size={11} />
                              <span>+50 First Submission</span>
                            </span>
                          )}
                        </div>

                        <div
                          onClick={() => setLightboxImageUrl(msg.imageUrl || null)}
                          className="relative rounded-lg overflow-hidden border border-[var(--line)] cursor-pointer group bg-black/5"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Class Diary"
                            className="w-full max-h-56 object-cover object-top group-hover:scale-102 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                            <Maximize2 size={15} />
                            <span>Click to Zoom & View Full Photo</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-[var(--text-muted)]">
                          <span>By <strong>{msg.diaryEntry?.uploadedByName || 'Classmate'}</strong></span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('diary_wall')}
                            className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Diary Wall &rarr;</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Upload Prompt if Diary not uploaded yet */}
                    {msg.canUploadDiary && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                          <Flame size={12} className="fill-amber-500" />
                          <span>+50 Speed Points Available</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClass(msg.targetClass || userClass);
                            setIsUploadOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                        >
                          <Camera size={13} strokeWidth={2.5} />
                          <span>Upload Today&apos;s Diary</span>
                        </button>
                      </div>
                    )}

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
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--surface)] border border-[var(--line)] hover:border-violet-500/50 hover:text-violet-600 transition-colors shadow-2xs cursor-pointer"
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
                <span>AI searching diary registry and curriculum...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            className="p-3 border-t shrink-0 flex items-center gap-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask AI: "Show today's diary", "homework", "exam dates"...`}
              className="flex-1 px-4 py-2 text-xs md:text-sm rounded-full border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] focus:outline-hidden focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: DAILY DIARY WALL / COLUMN */}
      {/* ==================================================================== */}
      {activeTab === 'diary_wall' && (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 animate-fade-in">
          {/* Banner: Speed Diary Contest */}
          <div
            className="p-4 rounded-2xl border bg-gradient-to-br from-amber-500/10 via-[var(--surface)] to-yellow-500/5 shadow-xs space-y-2.5"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-xs">
                  <Camera size={20} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <span>Campus Physical Diary Wall</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Nursery to 10
                    </span>
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Snap & upload today&apos;s blackboard diary notes. Visible across all classes!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Upload Diary</span>
              </button>
            </div>

            {/* Today's Class Incentive Pill */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                hasUserClassUploadedToday
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame size={14} className={hasUserClassUploadedToday ? 'text-emerald-500' : 'text-amber-500 fill-amber-500'} />
                <span>
                  {hasUserClassUploadedToday
                    ? `Class ${userClass} diary photo has already been logged for today!`
                    : `Be the FIRST in Class ${userClass} to upload today's diary to win +50 House Points!`}
                </span>
              </div>
              {!hasUserClassUploadedToday && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass(userClass);
                    setIsUploadOpen(true);
                  }}
                  className="text-[11px] font-bold underline cursor-pointer shrink-0"
                >
                  Upload Now
                </button>
              )}
            </div>
          </div>

          {/* Class Filter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mr-1 flex items-center gap-1">
              <Filter size={11} />
              <span>Class:</span>
            </span>
            {['all', '10', '9', '8', '7', '6', '5'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedDiaryClass(cls)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  selectedDiaryClass === cls
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] hover:border-[var(--primary)]'
                }`}
              >
                {cls === 'all' ? 'All Classes' : `Class ${cls}`}
              </button>
            ))}
          </div>

          {/* Diary Entries Grid / List */}
          {filteredDiaryEntries.length === 0 ? (
            <div
              className="p-8 rounded-2xl border text-center space-y-3"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="w-12 h-12 rounded-full mx-auto bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Camera size={24} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text)]">No Diary Uploaded for This Class</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                No student has uploaded the physical diary snapshot for this class yet. Be the first to snap the blackboard homework notes!
              </p>
              <button
                type="button"
                onClick={() => {
                  if (selectedDiaryClass !== 'all') setSelectedClass(selectedDiaryClass);
                  setIsUploadOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Upload Diary (+50 Pts)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDiaryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border overflow-hidden shadow-xs space-y-3 p-3.5 transition-all hover:border-[var(--primary)]"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                  }}
                >
                  {/* Top Meta Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                        Class {entry.classGrade}-{entry.section || 'A'}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                        {entry.dateStr}
                      </span>
                    </div>

                    {entry.isFirstSubmission && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-2xs">
                        <Trophy size={11} />
                        <span>First Submission (+{entry.pointsAwarded} pts)</span>
                      </span>
                    )}
                  </div>

                  {/* Physical Diary Photo Thumbnail with Zoom Trigger */}
                  <div
                    onClick={() => setLightboxImageUrl(entry.imageUrl)}
                    className="relative rounded-xl overflow-hidden border border-[var(--line)] cursor-pointer group bg-black/5"
                  >
                    <img
                      src={entry.imageUrl}
                      alt={`Class ${entry.classGrade} Diary`}
                      className="w-full h-48 object-cover object-top group-hover:scale-102 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs">
                      <Eye size={16} />
                      <span>Click to View Full Size</span>
                    </div>
                  </div>

                  {/* Extracted Homework Tasks */}
                  {entry.homeworkSummary && (
                    <div
                      className="p-2.5 rounded-xl border text-[11px] leading-relaxed text-[var(--text)] whitespace-pre-line"
                      style={{
                        backgroundColor: 'var(--surface-sunken)',
                        borderColor: 'var(--line)',
                      }}
                    >
                      <strong className="text-[var(--text)] block mb-0.5">Homework Notes:</strong>
                      {entry.homeworkSummary}
                    </div>
                  )}

                  {/* Footer Attribution */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-[var(--text-muted)] border-t border-[var(--line)]">
                    <span>
                      Uploaded by <strong>{entry.uploadedByName}</strong> (@{entry.uploadedByUsername})
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-500">
                      Verified Cloud D1 Log
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: STUDY SCHEDULER */}
      {/* ==================================================================== */}
      {activeTab === 'scheduler' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in">
          {/* Header Card */}
          <div
            className="p-4 rounded-2xl border bg-gradient-to-br from-violet-600/10 via-[var(--surface)] to-indigo-600/5 shadow-xs space-y-3"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-xs">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text)]">AI Intelligent Study Scheduler</h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Structures your afternoon with Pomodoro focus intervals based on Class {userClass} syllabus.
                </p>
              </div>
            </div>

            {/* Target Hours Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[var(--text-muted)]">Target Study Duration:</span>
                <span className="text-violet-600 dark:text-violet-400 tabular-nums font-black">{targetHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={targetHours}
                onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Subjects Selection */}
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1.5">
                Focus Subjects Today:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Computer'].map((sub) => {
                  const isPicked = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubjectFilter(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                        isPicked
                          ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                          : 'bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] hover:border-violet-500'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateManualSchedule}
              disabled={isGeneratingSchedule}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-95 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isGeneratingSchedule ? 'Calculating Optimal Schedule...' : 'Generate AI Focus Plan'}</span>
            </button>
          </div>

          {/* Current Active Plan */}
          {currentSchedule && (
            <div
              className="p-4 rounded-2xl border shadow-xs space-y-3"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-violet-600" />
                  <h3 className="text-xs font-bold text-[var(--text)]">{currentSchedule.grade} Today&apos;s Routine</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
                  {currentSchedule.totalDurationMin} Mins Focus
                </span>
              </div>

              <div className="space-y-2">
                {currentSchedule.items.map((item) => {
                  const done = completedTasks[item.id] || item.done;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleTaskCompletion(item.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        done
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 line-through opacity-75'
                          : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)] hover:border-violet-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--line)]'
                          }`}
                        >
                          {done && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">{item.task}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{item.timeBlock} • {item.subject}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          item.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-600'
                            : 'bg-blue-500/15 text-blue-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: UPLOAD PHYSICAL DIARY PHOTO */}
      {/* ==================================================================== */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-5 space-y-4 shadow-xl animate-scale-up"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">Upload Daily Class Diary</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    First submission for your class wins <strong>+50 House Points</strong>!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadDiary} className="space-y-3.5">
              {/* Class & Section pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                    Class Grade
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)]"
                  >
                    {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'UKG', 'LKG', 'Nursery'].map((c) => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)]"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'All'].map((s) => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Input / Camera Preview */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text)] block mb-1">
                  Physical Diary / Blackboard Photo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-[var(--line)]">
                    <img src={previewUrl} alt="Preview" className="w-full h-44 object-cover object-top" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-sunken)] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[var(--primary)] transition-colors p-4 text-center"
                  >
                    <Upload size={22} className="text-[var(--primary)]" />
                    <span className="text-xs font-bold text-[var(--text)]">Take photo or upload diary snapshot</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Clear photo of notebook or blackboard</span>
                  </div>
                )}
              </div>

              {/* Extracted Homework Notes */}
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                  Homework Notes / Subject Summary (Optional)
                </label>
                <textarea
                  value={homeworkNotes}
                  onChange={(e) => setHomeworkNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Maths: Ex 4.2 Q1 to Q6&#10;Physics: Laws of reflection&#10;English: Chapter 5 vocab"
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] border-[var(--line)] focus:outline-hidden focus:border-[var(--primary)] resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>{isUploading ? 'Uploading to D1...' : 'Submit & Claim Points'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: FULL RESOLUTION IMAGE LIGHTBOX */}
      {/* ==================================================================== */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer shadow-md z-10"
              aria-label="Close image"
            >
              <X size={18} />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Class Diary High Resolution"
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
