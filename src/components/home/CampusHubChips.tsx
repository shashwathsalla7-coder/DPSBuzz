'use client';

import Link from 'next/link';
import {
  Bot,
  BookOpen,
  HelpCircle,
  Users,
  Megaphone,
  Sparkles,
  Search,
  MessageSquare,
} from 'lucide-react';

export function CampusHubChips() {
  const hubs = [
    {
      title: 'WhatsApp Hub',
      subtitle: 'Official & Classes',
      icon: MessageSquare,
      href: '/school-whatsapp',
      badge: 'Live D1',
      color: 'from-emerald-600 to-green-500',
      textColor: 'text-emerald-500',
    },
    {
      title: 'AI Diary',
      subtitle: 'Homework & Rules',
      icon: Bot,
      href: '/ai-diary',
      badge: 'Bot',
      color: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-500',
    },
    {
      title: 'Study Corner',
      subtitle: 'Notes & Formulas',
      icon: BookOpen,
      href: '/study-corner',
      badge: 'Nursery–10',
      color: 'from-blue-600 to-indigo-500',
      textColor: 'text-blue-500',
    },
    {
      title: 'Question Box',
      subtitle: 'Daily Challenge',
      icon: HelpCircle,
      href: '/question-box',
      badge: '+10 pts',
      color: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Class Groups',
      subtitle: 'Nursery to 10th',
      icon: Users,
      href: '/groups',
      badge: 'Classrooms',
      color: 'from-purple-600 to-pink-500',
      textColor: 'text-purple-500',
    },
    {
      title: 'Notices',
      subtitle: "Principal's Desk",
      icon: Megaphone,
      href: '/notices',
      badge: 'Official',
      color: 'from-rose-500 to-orange-400',
      textColor: 'text-rose-500',
    },
    {
      title: 'Lost & Found',
      subtitle: 'Campus Recovery',
      icon: Search,
      href: '/lost-found',
      badge: 'Recovery',
      color: 'from-amber-600 to-red-500',
      textColor: 'text-amber-500',
    },
  ];

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-500" />
          <span>Campus Hub • Nursery to Class 10</span>
        </h3>
        <span className="text-[10px] font-semibold text-[var(--text-muted)]">Live Features</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <Link
              key={hub.title}
              href={hub.href}
              className="p-3 rounded-2xl border bg-[var(--surface)] hover:bg-[var(--surface-sunken)] hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-2 group shadow-2xs"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${hub.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon size={16} />
                </div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)]">
                  {hub.badge}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] group-hover:text-amber-500 transition-colors">
                  {hub.title}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                  {hub.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
