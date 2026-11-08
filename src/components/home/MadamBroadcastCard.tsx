'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Check,
  Plus,
  X,
  Send,
  Sparkles,
  Radio,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = DataStore.getCurrentUser();
  const username = currentUser?.username || 'student';

  useEffect(() => {
    // Sync broadcasts from server database
    SchoolFeatures.sync(username);

    const handleUpdate = () => {
      setBroadcasts(SchoolFeatures.getBroadcasts());
    };
    window.addEventListener('dpsbuzz:campus_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:campus_updated', handleUpdate);
  }, [username]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAcknowledge = async (id: string) => {
    await SchoolFeatures.acknowledgeBroadcast(id, username);
    setBroadcasts(SchoolFeatures.getBroadcasts());
    showToast('Notice acknowledged! Marked as read in database.');
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
      showToast('Broadcast published campus-wide to all devices! 🎓');
    } catch {
      showToast('Error publishing broadcast. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const latest = broadcasts.length > 0 ? broadcasts[0] : null;
  const isAcknowledged = latest ? (latest.acknowledgedBy || []).includes(username) : false;

  return (
    <div className="relative px-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-lg animate-fade-in flex items-center gap-2">
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}

      {!latest ? (
        /* Empty State / Principal Desk Card (Live Database Synced) */
        <div
          className="p-4 rounded-2xl border bg-gradient-to-br from-[var(--gold-tint)] via-[var(--surface)] to-[var(--gold-tint)] shadow-xs space-y-3 relative overflow-hidden backdrop-blur-xs"
          style={{ borderColor: 'var(--line)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold-tint)] rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold)] text-white flex items-center justify-center font-black shadow-xs border-2 border-[var(--gold)]">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">
                    Office of the Principal
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[var(--gold-tint)] text-[var(--gold)] dark:text-[var(--gold)]">
                    <ShieldCheck size={11} />
                    <span>Official Desk</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Cloud</span>
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Direct Broadcast Desk • Nursery to Class 10
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] text-black font-bold text-xs rounded-full hover:opacity-95 active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Compose Broadcast"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>+ Broadcast</span>
            </button>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--surface-sunken)] p-3 rounded-xl border border-[var(--line)]">
            No active circulars at this moment. Official dispatches, emergency notices, and circulars issued by Madam will appear here directly on all student and parent devices.
          </p>
        </div>
      ) : (
        /* Main Broadcast Card (Real-Time Live from Database) */
        <div
          className="p-4 rounded-2xl border bg-gradient-to-br from-[var(--gold-tint)] via-[var(--surface)] to-[var(--gold-tint)] shadow-xs space-y-3 relative overflow-hidden backdrop-blur-xs"
          style={{ borderColor: 'var(--line)' }}
        >
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold-tint)] rounded-full blur-2xl pointer-events-none" />

          {/* Header with Principal Seal */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {latest.senderAvatar ? (
                  <img
                    src={latest.senderAvatar}
                    alt={latest.sender}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[var(--gold)] shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold)] text-white flex items-center justify-center font-black shadow-xs border-2 border-[var(--gold)]">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xs">
                  <GraduationCap size={12} strokeWidth={2.5} />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[var(--text)] tracking-tight">
                    {latest.sender}
                  </h3>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[var(--gold-tint)] text-[var(--gold)] dark:text-[var(--gold)]">
                    <ShieldCheck size={11} />
                    <span>Office of Principal</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
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
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[var(--primary-tint)] text-[var(--primary)] dark:text-[var(--primary)] animate-pulse">
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
                {latest.acknowledgedBy?.length || 0} students & parents acknowledged
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleAcknowledge(latest.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAcknowledged
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--surface-sunken)] hover:bg-[var(--gold-tint)] hover:text-[var(--gold)] border border-[var(--line)]'
              }`}
            >
              <Check size={13} className={isAcknowledged ? 'text-emerald-500' : ''} />
              <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
            </button>
          </div>
        </div>
      )}

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
                    Direct Cloud broadcast to students & parents across all phones & computers
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
                  className="w-full h-9 px-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
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
                  placeholder="Type the official message here. It will be stored in the cloud database and synced to all student phones instantly..."
                  className="w-full p-3 rounded-xl border bg-[var(--surface-sunken)] text-[var(--text)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--gold)] leading-relaxed"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <ShieldCheck size={12} className="text-[var(--gold)]" />
                <span>Sender: Office of the Principal</span>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:opacity-95 shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Publishing...' : 'Send Broadcast'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
