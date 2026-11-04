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
} from 'lucide-react';
import { SchoolFeatures } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export default function AiDiaryPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: "👋 Namaste! I am your **DPS Buzz AI Diary Assistant**.\n\nI have access to daily homework diaries, the examination timetable, uniform guidelines, and Madam's official announcements for Nursery to Class 10.\n\nHow can I help you today?",
      timestamp: 'Just now',
      suggestions: [
        "What is today's homework?",
        'What is tomorrow uniform?',
        'Upcoming exam timetable',
        "Show Madam's message",
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = DataStore.getCurrentUser();
  const userClass = currentUser?.class || '8';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
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

    // Simulate natural AI thinking delay for high-tech experience
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
    }, 500);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `Chat reset. I am ready to help with **Class ${userClass}** homework, timetable, or school rules!`,
        timestamp: 'Just now',
        suggestions: [
          "What is today's homework?",
          'Uniform schedule',
          'Bus timings for today',
        ],
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-1rem)] max-w-3xl mx-auto select-none bg-[var(--surface)] text-[var(--text)]">
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-sm font-bold">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight">AI Diary Assistant</h1>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Nursery to Class 10 Knowledge Base
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-sunken)] rounded-full transition-colors"
          title="Reset chat"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* Quick Category Chips */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto no-scrollbar shrink-0 text-xs"
        style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-sunken)' }}
      >
        <button
          type="button"
          onClick={() => handleSend("What is today's homework?")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-amber-500/50 transition-colors shadow-2xs"
        >
          <BookOpen size={13} className="text-amber-500" />
          <span>Today's Diary</span>
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
          <span>Exam Dates</span>
        </button>
        <button
          type="button"
          onClick={() => handleSend('What are the school bus timings?')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-emerald-500/50 transition-colors shadow-2xs"
        >
          <Bus size={13} className="text-emerald-500" />
          <span>Bus Timings</span>
        </button>
        <button
          type="button"
          onClick={() => handleSend("Show Madam's message")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] font-semibold shrink-0 hover:border-rose-500/50 transition-colors shadow-2xs"
        >
          <GraduationCap size={13} className="text-rose-500" />
          <span>Madam's Desk</span>
        </button>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shrink-0 shadow-xs">
                  <Sparkles size={16} />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isAi
                      ? 'bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text)]'
                      : 'bg-[var(--primary)] text-[var(--on-primary)] font-medium ml-auto'
                  }`}
                  style={{
                    borderRadius: isAi ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem',
                  }}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>

                {/* AI Follow-up suggestions */}
                {isAi && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestions.map((sugg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(sugg)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-amber-500/50 transition-all text-left"
                      >
                        💡 {sugg}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 justify-start items-center text-xs text-[var(--text-muted)]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black shrink-0 animate-pulse">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1 font-medium">Checking DPS diary records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div
        className="p-3 border-t shrink-0"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-2xl mx-auto"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask anything about Class ${userClass} diary, timetable, uniform...`}
            className="flex-1 h-11 px-4 text-xs md:text-sm rounded-full border bg-[var(--surface-sunken)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            style={{ borderColor: 'var(--line)' }}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shrink-0 cursor-pointer font-bold"
            aria-label="Send query"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
          DPS Buzz AI Assistant • Verified with school diary & official circulars
        </p>
      </div>
    </div>
  );
}
