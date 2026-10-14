'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClassSections } from '@/config/school';
import { DataStore, type SongTrack } from '@/lib/dataStore';
import Logo from '@/components/ui/Logo';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';
import { Music, Gift, Shield, CheckCircle2 } from 'lucide-react';

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Student Information & School Verification
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('8');
  const [section, setSection] = useState('A');
  const [isPrivate, setIsPrivate] = useState(false);
  const [schoolCode, setSchoolCode] = useState('DPS71845');
  const [referredBy, setReferredBy] = useState('');

  // Step 2: Credentials & Favorite Song (Optional)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [favoriteSong, setFavoriteSong] = useState<SongTrack | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);

  // Step 3: Rules & Privacy
  const [acceptedRules, setAcceptedRules] = useState(false);

  // Auto-detect referral query parameter from URL (e.g. /signup?ref=shashwath71845)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferredBy(ref.toLowerCase().trim().replace(/^@/, ''));
      }
    }
  }, []);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name to continue.');
      return;
    }

    if (schoolCode.trim()) {
      const clean = schoolCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const validCode = DataStore.getInviteCode().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (
        clean !== 'DPS71845' &&
        clean !== '71845' &&
        clean !== validCode &&
        clean !== 'DPSBUZZ2026' &&
        !clean.includes('71845')
      ) {
        setError('Please enter school code DPS71845 to continue.');
        return;
      }
    }

    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password || !confirmPassword) {
      setError('Please fill in all account fields.');
      return;
    }
    if (username.length > 20) {
      setError('Username must be 20 characters or less.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Type them again carefully.");
      return;
    }

    setStep(3);
  };

  const handleSignup = async () => {
    if (!acceptedRules) {
      setError('You must accept the school community rules to join.');
      return;
    }

    setError('');
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const result = DataStore.registerStudent({
      fullName: fullName.trim(),
      className,
      section,
      username: username.trim(),
      inviteCode: schoolCode.trim() || 'DPS71845',
      isPrivate,
      song: favoriteSong || undefined,
      referredBy: referredBy.trim() || undefined,
    });

    if (!result.success || !result.profile) {
      setError(result.error || 'Failed to complete registration.');
      setIsLoading(false);
      return;
    }

    localStorage.setItem('dpsbuzz_user', JSON.stringify(result.profile));
    document.cookie = `dpsbuzz_user=${encodeURIComponent(JSON.stringify(result.profile))}; path=/; max-age=31536000; SameSite=Lax`;

    // Sync newly created student profile to server so Android App immediately sees it
    fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: result.profile }),
    }).catch(() => {});

    setIsLoading(false);
    router.push('/home');
  };

  return (
    <div className="w-full space-y-6">
      {/* Official Poster Brand Logo */}
      <div className="text-center space-y-2 flex flex-col items-center">
        <Logo size="xl" className="justify-center" />
        <p
          className="text-sm font-extrabold tracking-tight"
          style={{
            fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
            color: 'var(--text)',
          }}
        >
          Your School. Your People. Your Buzz.
        </p>
      </div>

      {/* 3 Step Indicator */}
      <div className="flex items-center gap-2 px-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              backgroundColor: s <= step ? 'var(--primary)' : 'var(--line-strong)',
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div
        className="p-6 rounded-2xl border space-y-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        {error && (
          <div
            className="p-3 rounded-lg text-xs font-medium border"
            style={{
              backgroundColor: 'var(--surface-sunken)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Student Information & School Verification */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Step 1 of 3: Student Details & Verification
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Enter your details and the school invite code
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fn" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Full Name
              </label>
              <input
                id="fn"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="cls" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Class
                </label>
                <select
                  id="cls"
                  value={className}
                  onChange={(e) => {
                    const newClass = e.target.value;
                    setClassName(newClass);
                    const validSections = getClassSections(newClass);
                    if (!validSections.includes(section)) {
                      setSection(validSections[0]);
                    }
                  }}
                  className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="6">Class 6 (A-F)</option>
                  <option value="7">Class 7 (A-G)</option>
                  <option value="8">Class 8 (A-G)</option>
                  <option value="9">Class 9 (A-G)</option>
                  <option value="10">Class 10 (A-G)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sec" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                  Section
                </label>
                <select
                  id="sec"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                    color: 'var(--text)',
                  }}
                >
                  {getClassSections(className).map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>


            {/* School Code (Official: DPS71845) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label htmlFor="sc" className="block text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Shield size={13} style={{ color: 'var(--primary)' }} />
                  <span>School Code</span>
                </label>
                <span className="text-[10px] text-emerald-500 font-bold">✓ DPS71845 Verified</span>
              </div>
              <input
                id="sc"
                type="text"
                placeholder="DPS71845"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none uppercase font-mono tracking-wider"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Official school code: <strong className="text-pink-500">DPS71845</strong>
              </p>
            </div>

            {/* Referral Username (Optional: +25 Points Bonus) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label htmlFor="ref" className="block text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  <Gift size={13} className="text-pink-500" />
                  <span>Referred by (Optional)</span>
                </label>
                <span className="text-[10px] text-pink-500 font-bold">+25 Pts Bonus</span>
              </div>
              <input
                id="ref"
                type="text"
                placeholder="Classmate username (optional)"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Got invited by a friend? You both receive +25 points upon signing up!
              </p>
            </div>

            {/* Account Privacy Choice: Public vs Private */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Account Privacy
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !isPrivate
                      ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--primary-tint)]'
                      : 'border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">🌐</span>
                    {!isPrivate && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      Public Account
                    </p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Any school student can view your posts and chat
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isPrivate
                      ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] bg-[var(--primary-tint)]'
                      : 'border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">🔒</span>
                    {isPrivate && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                      Private Account
                    </p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      Students must request follow before chatting or viewing posts
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl text-sm font-semibold transition btn-press flex items-center justify-center cursor-pointer shadow-sm hover:opacity-95"
              style={{
                backgroundColor: 'var(--accent-cta)',
                color: 'var(--on-accent-cta)',
              }}
            >
              Continue to Step 2
            </button>
          </form>
        )}

        {/* Step 2: Username, Password & Favorite Song */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Step 2 of 3: Username, Security & Music
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Pick your handle, password, and signature favorite song
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="un" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Username
              </label>
              <input
                id="un"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoFocus
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pw" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Password
              </label>
              <input
                id="pw"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cpw" className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
                Confirm Password
              </label>
              <input
                id="cpw"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl border text-sm transition outline-none"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              />
            </div>

            {/* Favorite Song / Profile Anthem (Optional) */}
            <div className="space-y-2 pt-3 border-t border-[var(--line)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <Music size={13} className="text-pink-500" />
                    <span>Favorite Song / Profile Anthem</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-[var(--surface-sunken)] border border-[var(--line)] text-[var(--text-muted)] font-bold">
                    Optional
                  </span>
                </div>
                {favoriteSong && (
                  <button
                    type="button"
                    onClick={() => setFavoriteSong(null)}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Choose your favorite track to play on your profile and show your musical vibe!
              </p>

              {favoriteSong ? (
                <div className="pt-1">
                  <MusicTrackPill song={favoriteSong} onRemove={() => setFavoriteSong(null)} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSongPicker(true)}
                  className="w-full py-3 px-3 rounded-xl border border-dashed border-[var(--line)] hover:border-pink-500/50 bg-[var(--surface-sunken)] hover:bg-pink-500/5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text)] hover:text-pink-400 transition-colors cursor-pointer"
                >
                  <Music size={15} />
                  <span>Choose Your Favorite Song 🎵</span>
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 px-4 rounded-xl text-xs font-semibold border btn-press"
                style={{
                  borderColor: 'var(--line-strong)',
                  color: 'var(--text)',
                  backgroundColor: 'transparent',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 h-12 rounded-xl text-sm font-semibold transition btn-press flex items-center justify-center cursor-pointer shadow-sm hover:opacity-95"
                style={{
                  backgroundColor: 'var(--accent-cta)',
                  color: 'var(--on-accent-cta)',
                }}
              >
                Continue to Step 3
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Rules, Summary & Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
                Step 3 of 3: Community Rules & Confirmation
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Review your profile details and accept school community rules
              </p>
            </div>

            {/* Profile Overview Card */}
            <div
              className="p-3.5 rounded-xl border space-y-2 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--surface-sunken)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
            >
              <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                <span className="font-semibold text-[var(--text-muted)]">Student:</span>
                <span className="font-bold text-[var(--text)]">{fullName} (@{username})</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                <span className="font-semibold text-[var(--text-muted)]">Class & Section:</span>
                <span className="font-bold text-[var(--text)]">Class {className}-{section}</span>
              </div>
              <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                <span className="font-semibold text-[var(--text-muted)]">Account Privacy:</span>
                <span className="font-bold text-[var(--primary)] flex items-center gap-1">
                  {isPrivate ? '🔒 Private' : '🌐 Public'}
                </span>
              </div>
              {favoriteSong && (
                <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                  <span className="font-semibold text-[var(--text-muted)]">Favorite Song:</span>
                  <span className="font-bold text-pink-500 truncate max-w-[180px]">🎵 {favoriteSong.title}</span>
                </div>
              )}
              {referredBy && (
                <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]">
                  <span className="font-semibold text-[var(--text-muted)]">Referred by:</span>
                  <span className="font-bold text-pink-500 flex items-center gap-1">
                    <Gift size={11} /> @{referredBy} (+25 Bonus Pts)
                  </span>
                </div>
              )}

              <div className="pt-1 space-y-1.5 text-[11px] text-[var(--text-muted)]">
                <p>1. <strong>Be respectful:</strong> No bullying, abusive comments, or mean nicknames.</p>
                <p>2. <strong>School only:</strong> Do not share personal phone numbers or private home addresses.</p>
                <p>3. <strong>Moderated:</strong> Posts with 3 reports are auto-hidden until the school admin reviews them.</p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ color: 'var(--text)' }}>
                I agree to the school community rules.
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 px-4 rounded-xl text-xs font-semibold border btn-press"
                style={{
                  borderColor: 'var(--line-strong)',
                  color: 'var(--text)',
                  backgroundColor: 'transparent',
                }}
              >
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl text-sm font-semibold transition btn-press flex items-center justify-center cursor-pointer shadow-sm hover:opacity-95"
                style={{
                  backgroundColor: 'var(--accent-cta)',
                  color: 'var(--on-accent-cta)',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Creating account...' : 'Complete registration'}
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--line)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link
            href="/login"
            className="font-semibold hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        onSelectSong={(track) => {
          setFavoriteSong(track);
          setShowSongPicker(false);
        }}
        title="Pick Your Favorite Song 🎵"
      />
    </div>
  );
}
