'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
  Lock,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { DataStore, Profile } from '@/lib/dataStore';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = (params?.code as string) || '';

  const [invite, setInvite] = useState<{
    id: string;
    channelId: string;
    channelName: string;
    grade: string;
    section: string;
    memberCount: number;
    roleGranted: string;
    hasPassword: boolean;
    requireApproval: boolean;
    createdBy: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load current user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = DataStore.getCurrentUser();
      if (u && u.username && u.username !== 'guest') {
        setCurrentUser(u);
      }
    }
  }, []);

  // Fetch invite link metadata
  useEffect(() => {
    if (!inviteCode) return;
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/campus?action=get_invite_link_details&code=${encodeURIComponent(inviteCode)}`);
        const data = await res.json();
        if (res.ok && data.success && data.invite) {
          setInvite(data.invite);
        } else {
          setError(data.error || 'Invite link is invalid or expired.');
        }
      } catch (err) {
        setError('Failed to reach campus server. Please check internet connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [inviteCode]);

  // Handle quick login
  const handleQuickLogin = (uname: string, name: string, role: string) => {
    const prof: Profile = {
      id: `usr-${uname}`,
      username: uname,
      fullName: name,
      avatar: '',
      bio: `${role.toUpperCase()} at Delhi Public School`,
      role: (role === 'teacher' || role === 'admin' ? role : 'student'),
      class: 'Class 8',
      section: 'G',
      isVerified: true,
      isApproved: true,
      followerCount: 12,
      followingCount: 15,
      postCount: 4,
      spiritPoints: 120,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('dpsbuzz_user', JSON.stringify(prof));
    document.cookie = `dpsbuzz_user=${encodeURIComponent(JSON.stringify(prof))}; path=/; max-age=31536000; SameSite=Lax`;
    setCurrentUser(prof);
  };

  const handleJoin = async () => {
    if (!currentUser) {
      alert('Please sign in or select your profile below to join the classroom.');
      return;
    }
    if (invite?.hasPassword && !password.trim()) {
      alert('This classroom link requires a passcode. Please enter the password.');
      return;
    }

    setJoinLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_via_invite_link',
          inviteCode,
          username: currentUser.username,
          fullName: currentUser.fullName,
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          setSuccessMessage(data.message || 'Join request submitted! Group administrators will review your request.');
        } else {
          setSuccessMessage(`Enrolled successfully in ${invite?.channelName}! Opening classroom...`);
          // Store active room preference and navigate
          setTimeout(() => {
            router.push(`/campus-wire?activeRoom=${encodeURIComponent(invite?.channelId || '')}`);
          }, 1200);
        }
      } else {
        setError(data.error || 'Failed to join group. Please check password or permissions.');
      }
    } catch (err: any) {
      setError('Network error while processing join. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-[#4f46e5] selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15)_0%,_transparent_60%)]" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#4f46e5] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#4f46e5]/30">
            W
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Campus Wire</span>
          <span className="px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24] text-[10px] font-bold border border-[#fbbf24]/30">
            DPS Buzz Official
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#161f2e] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#4f46e5] border-t-transparent animate-spin" />
              <p className="text-xs text-[#94a3b8]">Verifying classroom invitation link...</p>
            </div>
          ) : error && !invite ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f87171]/20 text-[#f87171] flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Invitation Link Invalid</h3>
              <p className="text-xs text-[#94a3b8] max-w-xs">{error}</p>
              <button
                onClick={() => router.push('/campus-wire')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#1e293b] hover:bg-[#253347] text-xs font-semibold text-white border border-white/10 cursor-pointer"
              >
                Go to Campus Wire
              </button>
            </div>
          ) : invite ? (
            <>
              {/* Group Identity Card */}
              <div className="flex flex-col items-center text-center space-y-2.5 pb-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#4f46e5] to-[#6366f1] flex items-center justify-center font-extrabold text-white text-2xl shadow-xl shadow-[#4f46e5]/25 border-2 border-white/10">
                  {invite.grade ? invite.grade.replace(/[^0-9]/g, '') || invite.channelName.slice(0, 2).toUpperCase() : 'DP'}
                </div>

                <div>
                  <h2 className="text-base font-bold text-white leading-snug">{invite.channelName}</h2>
                  <p className="text-xs text-[#94a3b8] flex items-center justify-center gap-1.5 mt-0.5">
                    <Users size={13} className="text-[#38bdf8]" />
                    <span>{invite.memberCount} enrolled members</span>
                    {invite.grade && <span>• {invite.grade}</span>}
                  </p>
                </div>

                {/* Role Offered Badge */}
                <div className="pt-1">
                  {invite.roleGranted === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbbf24]/15 text-[#fbbf24] text-xs font-bold border border-[#fbbf24]/30 shadow-xs">
                      <Shield size={13} />
                      Classroom Admin Invitation ⭐️
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a884]/15 text-[#00a884] text-xs font-semibold border border-[#00a884]/30">
                      <Users size={13} />
                      Student Member Invitation
                    </span>
                  )}
                </div>
              </div>

              {/* Success Notification */}
              {successMessage ? (
                <div className="p-4 rounded-xl bg-[#00a884]/15 border border-[#00a884]/30 flex items-start gap-3 animate-fadeIn">
                  <CheckCircle2 size={18} className="text-[#00a884] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#e9edef] font-medium leading-relaxed">{successMessage}</div>
                </div>
              ) : (
                <>
                  {/* Error Notification */}
                  {error && (
                    <div className="p-3 rounded-xl bg-[#f87171]/15 border border-[#f87171]/30 flex items-center gap-2.5 text-xs text-[#f87171]">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Password Field if Required */}
                  {invite.hasPassword && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5">
                        <KeyRound size={13} className="text-[#fbbf24]" />
                        Enter Group Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="Group secret password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#fbbf24] transition-colors"
                      />
                    </div>
                  )}

                  {/* Current Active User or Auth Prompt */}
                  {currentUser ? (
                    <div className="p-3 rounded-xl bg-[#0b0f17] border border-white/10 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {currentUser.fullName ? currentUser.fullName.slice(0, 1).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{currentUser.fullName}</div>
                          <div className="text-[10px] text-[#94a3b8] truncate">
                            @{currentUser.username} • {currentUser.role}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 shrink-0">
                        Active Account
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-white/10 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#fbbf24]">
                        <LogIn size={14} />
                        Sign in to join with your school account
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('shashwath71845', 'Shashwath', 'admin')}
                          className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-[11px] font-medium text-white border border-white/5 transition-colors cursor-pointer text-left"
                        >
                          👤 Shashwath (Admin)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('sahana_3009', 'Sahana', 'student')}
                          className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-[11px] font-medium text-white border border-white/5 transition-colors cursor-pointer text-left"
                        >
                          🎓 Sahana (Student)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('rishi_one9', 'Rishi', 'student')}
                          className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-[11px] font-medium text-white border border-white/5 transition-colors cursor-pointer text-left"
                        >
                          🎓 Rishi (Student)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('teacher_anita', 'Anita Sharma', 'teacher')}
                          className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-[11px] font-medium text-white border border-white/5 transition-colors cursor-pointer text-left"
                        >
                          📚 Anita (Faculty)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Primary Join Action Button */}
                  <button
                    onClick={handleJoin}
                    disabled={joinLoading || !currentUser}
                    className="w-full py-3 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-[#4f46e5]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>
                      {joinLoading
                        ? 'Enrolling in Classroom...'
                        : invite.requireApproval
                        ? 'Request to Join Group (Needs Approval)'
                        : invite.roleGranted === 'admin'
                        ? 'Join Group as Classroom Admin ⭐️'
                        : 'Join Classroom Group'}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </>
              )}
            </>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-[#94a3b8]">
          Protected by Delhi Public School verified student directory • Zero external spam
        </div>
      </div>
    </div>
  );
}
