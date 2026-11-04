'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  Check,
  Plus,
  X,
  Send,
  Users,
  Megaphone,
  Bell,
  Sparkles,
} from 'lucide-react';
import { SchoolFeatures, type PrincipalBroadcast } from '@/lib/schoolFeatures';
import { DataStore } from '@/lib/dataStore';

export function MadamBroadcastCard() {
  const [broadcasts, setBroadcasts] = useState<PrincipalBroadcast[]>(() =>
    SchoolFeatures.getBroadcasts()
  );
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAudience, setNewAudience] = useState<'all' | 'nursery_5' | 'seniors_6_10' | 'teachers'>('all');
  const [newPriority, setNewPriority] = useState<'urgent' | 'high' | 'normal'>('high');
  const [toast, setToast] = useState<string | null>(null);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';
  const isAdmin = currentUser?.role === 'admin' || username.toLowerCase() === 'shashwath71845';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAcknowledge = (id: string) => {
    SchoolFeatures.acknowledgeBroadcast(id, username);
    setBroadcasts(SchoolFeatures.getBroadcasts());
    showToast('Notice acknowledged! Marked as read.');
  };

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const created = SchoolFeatures.createBroadcast({
      title: newTitle,
      message: newMessage,
      targetAudience: newAudience,
      priority: newPriority,
    });

    setBroadcasts(SchoolFeatures.getBroadcasts());
    setIsComposeOpen(false);
    setNewTitle('');
    setNewMessage('');
    showToast('Broadcast published campus-wide to all students & parents! 🎓');
  };

  if (broadcasts.length === 0) return null;
  const latest = broadcasts[0];
  const isAcknowledged = (latest.acknowledgedBy || []).includes(username);

  return (
    <div className="relative px-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Broadcast Card */}
      <div
        className="p-4 rounded-2xl border bg-gradient-to-br from-amber-500/10 via-[var(--surface)] to-yellow-500/5 shadow-xs space-y-3 relative overflow-hidden"
        style={{ borderColor: 'var(--line)' }}
      >
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Principal Seal */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={latest.senderAvatar}
                alt={latest.sender}
                className="w-11 h-11 rounded-full object-cover border-2 border-amber-500/40 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xs">
                <GraduationCap size={12} strokeWidth={2.5} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">
                  {latest.sender}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <ShieldCheck size={11} />
                  <span>Office of Principal</span>
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                <span>{latest.senderRole}</span>
                <span>•</span>
                <span>{latest.date}</span>
              </p>
            </div>
          </div>

          {/* Compose button (Visible for Admin / Madam or Demo) */}
          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[11px] rounded-full hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
            title="Compose Principal Broadcast"
          >
            <Plus size={13} strokeWidth={3} />
            <span>Broadcast</span>
          </button>
        </div>

        {/* Broadcast Body */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              📢 {latest.targetAudienceLabel}
            </span>
            {latest.priority === 'urgent' && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse">
                Urgent
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-[var(--text)] leading-snug">
            {latest.title}
          </h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
            {latest.message}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--line)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px]">
              {latest.acknowledgedBy?.length || 12} students & parents acknowledged
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAcknowledge(latest.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isAcknowledged
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-[var(--surface-sunken)] hover:bg-amber-500/10 hover:text-amber-500 border border-[var(--line)]'
            }`}
          >
            <Check size={13} className={isAcknowledged ? 'text-emerald-500' : ''} />
            <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
          </button>
        </div>
      </div>

      {/* Compose Broadcast Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form
            onSubmit={handleCreateBroadcast}
            className="w-full max-w-lg rounded-2xl border bg-[var(--surface)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text)]">Principal's Broadcast Desk</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Instant message to students & parents without forwarding
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Broadcast Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule for Half-Yearly Assessments"
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Target Audience</label>
                  <select
                    value={newAudience}
                    onChange={(e: any) => setNewAudience(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="all">Nursery to Class 10 (All)</option>
                    <option value="nursery_5">Junior School (Nursery to 5)</option>
                    <option value="seniors_6_10">Senior School (Classes 6 to 10)</option>
                    <option value="teachers">Faculty & Staff</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[var(--text)]">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Circular</option>
                    <option value="normal">Standard Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text)]">Principal's Message *</label>
                <textarea
                  required
                  rows={5}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type the official message here. It will be sent to all student phones immediately..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 leading-relaxed"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] text-[var(--text-muted)]">
                Sender: Mrs. Sunitha Rao (Principal)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-sunken)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:opacity-95 shadow-sm flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
