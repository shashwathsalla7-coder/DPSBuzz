'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pin, Paperclip, CheckCheck, Calendar as CalendarIcon, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataStore, type Notice, type CalendarEvent } from '@/lib/dataStore';
import { colors } from '@/config/tokens';

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2026, 9, 1)); // October 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const reloadData = () => {
    setNotices(DataStore.getNotices());
    setCalendarEvents(DataStore.getCalendarEvents());
  };

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, []);

  const categories = ['All', 'Urgent', 'Exams', 'Holidays', 'Sports', 'Events', 'Fees'];

  const getCatColor = (cat: string) => {
    const key = (cat || 'urgent').toLowerCase();
    const map = colors.notices as Record<string, { light: string; dark: string }>;
    return map[key]?.light || colors.light.primary;
  };

  const filteredNotices = notices.filter((n) => {
    if (selectedCategory === 'All') return true;
    return n.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const currentUser = DataStore.getCurrentUser();
  const isAdmin = currentUser?.username?.toLowerCase() === 'shashwath71845';

  return (
    <div className="space-y-4 pb-24 select-none">
      {/* Top Mobile Bar with Apple Rounded Corners */}
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
          <h1
            className="text-lg font-bold tracking-[-0.02em] leading-[1.15]"
            style={{
              fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
              color: 'var(--text)',
            }}
          >
            School Notices
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1 bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold rounded-full flex items-center gap-1 shrink-0 hover:opacity-90 shadow-sm"
            >
              + Create Notice
            </Link>
          )}

          {/* List / Calendar iOS Segmented Control */}
          <div
            className="flex p-0.5 rounded-full border text-xs"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-3 py-1 rounded-full font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className="px-3 py-1 rounded-full font-semibold transition-all cursor-pointer"
              style={{
                backgroundColor: viewMode === 'calendar' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'calendar' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-[480px] mx-auto space-y-4">
        {/* Category Filter Chips (6px radius, not pills) & Mark All Read */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
            {categories.map((c) => {
              const isSelected = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className="h-8 px-3.5 rounded-[6px] text-xs font-semibold shrink-0 transition-all btn-press cursor-pointer shadow-xs"
                  style={{
                    backgroundColor: isSelected ? 'var(--primary-tint)' : 'var(--surface-sunken)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--line)',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              DataStore.markAllNoticesAsRead();
              reloadData();
            }}
            className="h-8 px-3 rounded-full text-[11px] font-bold border shrink-0 btn-press cursor-pointer whitespace-nowrap shadow-xs hover:border-[var(--primary)] transition-colors"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--line)',
              color: 'var(--primary)',
            }}
            title="Mark all notices as read"
          >
            Mark All Read ✓
          </button>
        </div>

        {/* Notices Content */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredNotices.length === 0 ? (
              /* Empty Notices Card with Apple Squircle Corners */
              <div
                className="p-8 rounded-[22px] border text-center space-y-2 shadow-sm"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center text-xl mb-2">
                  📢
                </div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  No notices right now. Check again after assembly.
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  New circulars and exam schedules are posted by the school admin office.
                </p>
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const catColor = getCatColor(notice.category);
                const isRead = DataStore.isNoticeRead(notice.id);
                return (
                  /* Notice Card with Apple Rounded Corners [20px] and Soft Accents */
                  <Link
                    key={notice.id}
                    href={`/notices/${notice.id}`}
                    prefetch={true}
                    onClick={() => DataStore.markNoticeAsRead(notice.id)}
                    className="block p-4 rounded-[20px] border transition-all btn-press shadow-xs hover:shadow-md relative overflow-hidden group"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor: 'var(--line)',
                      opacity: isRead ? 0.85 : 1,
                    }}
                  >
                    {/* Left Apple Accent Pill Bar */}
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full"
                      style={{ backgroundColor: catColor }}
                    />

                    <div className="pl-2 space-y-2">
                      {/* Header: Pinned icon + Category label + Unread Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {notice.pinned && (
                            <Pin size={13} style={{ color: 'var(--text-muted)' }} />
                          )}
                          <span
                            className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${catColor}15`,
                              color: catColor,
                            }}
                          >
                            {notice.category}
                          </span>
                          {!isRead && (
                            <span
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                color: '#F59E0B',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                              }}
                            >
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {notice.date}
                        </span>
                      </div>

                      {/* Title in Cabinet Grotesk Display */}
                      <h3
                        className="text-base font-bold tracking-[-0.02em] leading-[1.15] group-hover:text-[var(--primary)] transition-colors"
                        style={{
                          fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
                          color: 'var(--text)',
                        }}
                      >
                        {notice.title}
                      </h3>

                      {/* 2-line preview */}
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {notice.content}
                      </p>

                      {/* Footer: Seen by + Attachments */}
                      <div
                        className="pt-2 border-t flex items-center justify-between text-xs"
                        style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCheck size={14} style={{ color: 'var(--primary)' }} />
                          <span className="tabular-nums">Seen by {notice.seenBy || 0}</span>
                        </div>
                        {notice.hasAttachment && (
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[11px] font-semibold text-[var(--text)]">
                            <Paperclip size={12} className="text-red-500" />
                            <span className="truncate max-w-[140px]">{notice.pdfName || 'PDF circular'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        ) : (
          /* Interactive Academic Calendar with Dynamic Month Navigation & Events */
          (() => {
            const year = calendarMonth.getFullYear();
            const month = calendarMonth.getMonth();
            const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const totalDays = new Date(year, month + 1, 0).getDate();
            const startDayIndex = new Date(year, month, 1).getDay();

            const getEventsForDay = (d: number) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              return calendarEvents.filter((ev) => ev.date?.startsWith(dateStr));
            };

            const displayedEvents = selectedDay
              ? getEventsForDay(selectedDay)
              : calendarEvents;

            return (
              <div
                className="p-5 rounded-[22px] border space-y-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                }}
              >
                {/* Month Navigator */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMonth(new Date(year, month - 1, 1));
                      setSelectedDay(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                    aria-label="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                    {monthName}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarMonth(new Date(year, month + 1, 1));
                      setSelectedDay(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                    aria-label="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {/* Offset empty spaces */}
                  {Array.from({ length: startDayIndex }).map((_, i) => (
                    <div key={`offset-${i}`} className="h-10" />
                  ))}

                  {/* Days of month */}
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const hasEvent = dayEvents.length > 0;
                    const isSelected = selectedDay === day;
                    const hasExam = dayEvents.some((e) => e.category === 'Exam');
                    const hasHoliday = dayEvents.some((e) => e.category === 'Holiday');

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className="h-10 rounded-[12px] flex flex-col items-center justify-center border transition-all cursor-pointer btn-press"
                        style={{
                          borderColor: isSelected ? 'var(--primary)' : 'var(--line)',
                          backgroundColor: isSelected
                            ? 'var(--primary)'
                            : hasEvent
                            ? 'var(--primary-tint)'
                            : 'var(--surface-sunken)',
                          color: isSelected
                            ? '#FFFFFF'
                            : hasEvent
                            ? 'var(--primary)'
                            : 'var(--text)',
                          fontWeight: isSelected || hasEvent ? 700 : 500,
                        }}
                      >
                        <span className="tabular-nums">{day}</span>
                        {hasEvent && (
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-0.5"
                            style={{
                              backgroundColor: isSelected
                                ? '#FFFFFF'
                                : hasExam
                                ? 'var(--danger)'
                                : hasHoliday
                                ? 'var(--success)'
                                : 'var(--primary)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                  Tap any day with a dot to view scheduled circulars, exams, and assemblies.
                </p>

                {/* Live Scheduled Events List */}
                <div className="pt-3 border-t border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                      {selectedDay ? `Events on Day ${selectedDay}` : 'Scheduled Events & Timetable'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {displayedEvents.length} {displayedEvents.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {displayedEvents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)] rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)]">
                      No scheduled events for this selected day.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayedEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 border rounded-[16px] flex items-start justify-between gap-3 shadow-xs"
                          style={{
                            backgroundColor: 'var(--surface-sunken)',
                            borderColor: 'var(--line)',
                          }}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full text-white"
                                style={{
                                  backgroundColor:
                                    ev.category === 'Exam'
                                      ? 'var(--danger)'
                                      : ev.category === 'Holiday'
                                      ? 'var(--success)'
                                      : 'var(--primary)',
                                }}
                              >
                                {ev.category}
                              </span>
                              <h4 className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                                {ev.title}
                              </h4>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {ev.description}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
                              {ev.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()

        )}
      </div>
    </div>
  );
}
