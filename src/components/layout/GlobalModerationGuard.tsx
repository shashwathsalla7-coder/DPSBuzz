'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Shield, LogOut, Check, Send, X, CheckCircle2 } from 'lucide-react';
import { DataStore, type Profile, type UserWarning } from '@/lib/dataStore';

export function GlobalModerationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [activeWarning, setActiveWarning] = useState<UserWarning | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReasonText, setAppealReasonText] = useState('');
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const checkStatus = () => {
    const user = DataStore.getCurrentUser();
    if (!user || !user.username || user.username.toLowerCase() === 'guest') {
      router.replace('/login');
      return;
    }

    setCurrentUser(user);

    const banned = DataStore.isUserBanned(user.username);
    setIsBanned(banned);
    if (banned) {
      setBanReason(DataStore.getBanReason(user.username));
    } else {
      const warning = DataStore.getUnacknowledgedWarning(user.username);
      setActiveWarning(warning);
    }
  };

  useEffect(() => {
    checkStatus();
    const handleUpdate = () => checkStatus();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dpsbuzz_user');
      localStorage.removeItem('dpsbuzz_shashwath_authenticated');
      document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
    }
    router.push('/login');
  };

  const handleAcknowledgeWarning = () => {
    if (activeWarning) {
      DataStore.acknowledgeWarning(activeWarning.id);
      setActiveWarning(null);
    }
  };

  const isAdmin = currentUser?.username?.toLowerCase() === 'shashwath71845';

  return (
    <>
      {/* 1. COMPLETE BAN FULL-SCREEN LOCKOUT (0px FLAT CORNERS) */}
      {isBanned && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center select-none rounded-none">
          <div className="w-16 h-16 bg-red-950 border border-red-500/60 flex items-center justify-center mb-4 text-red-500 rounded-none">
            <ShieldAlert size={36} />
          </div>
          <h1 className="text-xl font-black text-red-500 mb-2 tracking-wide uppercase">
            Account Suspended 🚫
          </h1>
          <p className="text-xs text-neutral-300 max-w-sm mb-3">
            Your DPS Buzz account (
            <span className="font-mono text-white font-semibold">@{currentUser?.username}</span>
            ) has been suspended by school administration.
          </p>

          <div className="bg-neutral-900 border border-neutral-800 p-3 max-w-sm w-full mb-4 text-left rounded-none">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
              Suspension Reason:
            </span>
            <span className="text-xs font-semibold text-red-300">
              {banReason || 'Severe community guideline violation or school policy infraction.'}
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 max-w-sm mb-6 leading-relaxed">
            While suspended, you cannot access feeds, view stories, or exchange messages with classmates.
            If you believe this is an error, please consult the school disciplinary head.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAppealModal(true);
                setAppealSubmitted(false);
              }}
              className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer rounded-none transition-colors"
            >
              <Send size={14} />
              <span>Submit Ban Appeal 📝</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 flex items-center gap-2 cursor-pointer rounded-none transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>

          {/* BAN APPEAL MODAL */}
          {showAppealModal && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[var(--surface)] border-2 border-pink-500 p-5 rounded-none text-left space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Official Reinstatement Appeal 📨
                  </h3>
                  <button
                    onClick={() => setShowAppealModal(false)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {appealSubmitted ? (
                  <div className="py-6 text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-[var(--text)]">Appeal Submitted Successfully</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Your statement was delivered to the School Disciplinary Board for review.
                    </p>
                    <button
                      onClick={() => setShowAppealModal(false)}
                      className="mt-3 px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded-none"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--text-muted)]">
                      Provide context and explain why your suspension should be lifted:
                    </p>
                    <textarea
                      value={appealReasonText}
                      onChange={(e) => setAppealReasonText(e.target.value)}
                      rows={4}
                      placeholder="Write your explanation here..."
                      className="w-full p-3 bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] rounded-none focus:outline-none focus:border-pink-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAppealModal(false)}
                        className="flex-1 py-2 bg-neutral-800 text-white text-xs font-bold rounded-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!currentUser?.username || !appealReasonText.trim()) return;
                          DataStore.submitBanAppeal({
                            username: currentUser.username,
                            fullName: currentUser.fullName,
                            appealType: 'suspension',
                            reason: appealReasonText.trim(),
                          });
                          setAppealSubmitted(true);
                        }}
                        disabled={!appealReasonText.trim()}
                        className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold rounded-none"
                      >
                        Submit Appeal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. OFFICIAL WARNING MODAL POPUP (0px FLAT CORNERS) */}
      {!isBanned && activeWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-none">
          <div className="bg-[var(--surface)] border-2 border-amber-500 p-5 max-w-md w-full text-center rounded-none shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/40 text-amber-500 flex items-center justify-center mx-auto mb-3 rounded-none">
              <AlertTriangle size={26} />
            </div>
            <h2 className="text-sm font-black text-[var(--text)] tracking-wider uppercase mb-1">
              Official Disciplinary Warning ⚠️
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Issued by {activeWarning.adminName || 'DPS Buzz Administration'} • {activeWarning.date}
            </p>

            <div className="bg-[var(--surface-sunken)] border border-[var(--line)] p-3 text-left mb-4 rounded-none">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Notice Directive:
              </span>
              <p className="text-xs font-semibold text-amber-400 leading-relaxed">
                "{activeWarning.reason}"
              </p>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] mb-5 leading-relaxed">
              Please review school social rules. Repeated violations will lead to permanent chat restrictions
              or immediate complete account ban.
            </p>

            <button
              onClick={handleAcknowledgeWarning}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2 rounded-none transition-colors"
            >
              <Check size={14} />
              <span>I Understand & Acknowledge</span>
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default GlobalModerationGuard;
