'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  LifeBuoy,
  UserX,
  FileText,
  LogOut,
  Trash2,
  X,
  Phone,
  AlertTriangle,
  Camera,
  Smartphone,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Music,
  Gift,
  Copy,
  Check,
} from 'lucide-react';
import { getAvatarColorPair } from '@/config/tokens';
import { DataStore, type SongTrack } from '@/lib/dataStore';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';

export default function SettingsPage() {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme mode: system | light | dark
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [quietHours, setQuietHours] = useState(true);
  const [schoolNoticesNotif, setSchoolNoticesNotif] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(true);

  // Sheets / Modals state
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);
  const [showBlockedSheet, setShowBlockedSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([
    'aditya_9b',
  ]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateProfileSong = (song: SongTrack | undefined) => {
    if (!currentUser) return;
    const updated = DataStore.updateProfile(currentUser.username, { song });
    if (updated) {
      setCurrentUser(updated);
      localStorage.setItem('dpsbuzz_user', JSON.stringify(updated));
      showToast(song ? `Profile anthem set to "${song.title}" 🎵` : 'Profile song removed');
    }
  };

  const handleCopyReferralLink = () => {
    if (!currentUser) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dpsbuzz.internal';
    const link = `${origin}/signup?ref=${currentUser.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedRefLink(true);
    showToast('Referral link copied! Share with friends to earn +25 points 🎁');
    setTimeout(() => setCopiedRefLink(false), 3000);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updatedUser = { ...currentUser, avatar: dataUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('dpsbuzz_user', JSON.stringify(updatedUser));
      DataStore.updateProfile(currentUser.username, { avatar: dataUrl });
      showToast('Profile photo updated from gallery! 📸');
    };
    reader.readAsDataURL(file);
  };

  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dpsbuzz_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {}
    }
    const savedTheme = localStorage.getItem('dpsbuzz_theme') as 'system' | 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Check camera permission if supported
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        navigator.permissions.query({ name: 'camera' as any }).then((result) => {
          setCameraPermissionGranted(result.state === 'granted');
          result.onchange = () => setCameraPermissionGranted(result.state === 'granted');
        }).catch(() => {});
      } catch {}
    }

    // If navigated from Stories "Tap to allow", smooth scroll to Permissions card
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'permissions') {
        setTimeout(() => {
          document.getElementById('permissions-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 180);
      }
    }
  }, []);

  const handleRequestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermissionGranted(true);
      showToast('Camera permission allowed! You can now shoot stories 📸');
    } catch {
      setCameraPermissionGranted(false);
      showToast('Camera blocked. Please allow camera in phone settings or browser ⚙️');
    }
  };

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('dpsbuzz_theme', newTheme);
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dpsbuzz_user');
    document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    localStorage.removeItem('dpsbuzz_user');
    document.cookie = 'dpsbuzz_user=; path=/; max-age=0; SameSite=Lax';
    setShowDeleteSheet(false);
    router.push('/login');
  };

  const unblockUser = (u: string) => {
    setBlockedUsers((prev) => prev.filter((item) => item !== u));
  };

  const colors = getAvatarColorPair(currentUser?.username || 'student');

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-28 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-1 rounded-full text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors"
            aria-label="Back to profile"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-bold text-[var(--text)] font-display">
            Settings
          </h1>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 border border-neutral-700 text-white text-xs font-semibold shadow-2xl rounded-none animate-fade-in">
          {toastMessage}
        </div>
      )}

      <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        {/* Account Row */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Account
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-none divide-y divide-[var(--line)] overflow-hidden">
            <Link
              href="/profile"
              className="p-3.5 flex items-center gap-3 hover:bg-[var(--surface-sunken)] transition-colors"
            >
              {/* Circular Avatar */}
              <div
                className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold shrink-0 border"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: 'var(--line)',
                }}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.fullName || 'Avatar'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (currentUser?.fullName || 'Student')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {currentUser?.fullName || 'Student'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  @{currentUser?.username || 'student'} · {currentUser?.role === 'admin' ? '🛡️ Administrator' : `Class ${currentUser?.class || '8'}-${currentUser?.section || 'A'}`}
                </p>
              </div>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </Link>

            {/* Change Profile Photo Button */}
            <div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
                style={{ color: 'var(--text)' }}
              >
                <div className="flex items-center gap-2.5">
                  <Camera size={16} style={{ color: 'var(--primary)' }} />
                  <span>Change Profile Photo from Gallery 📸</span>
                </div>
                <span className="text-[10px] text-[var(--primary)] font-bold">Upload</span>
              </button>
            </div>
          </div>
        </section>

        {/* Profile Anthem / Favorite Song */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Music size={13} className="text-pink-500" />
              <span>Profile Anthem & Favorite Song</span>
            </h2>
            <span className="text-[10px] text-pink-500 font-bold px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
              Music Vibe
            </span>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4 space-y-3">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Your signature song plays on your profile and shows classmates your musical vibe.
            </p>
            {currentUser?.song ? (
              <div className="space-y-2.5">
                <MusicTrackPill song={currentUser.song} onRemove={() => handleUpdateProfileSong(undefined)} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSongPicker(true)}
                    className="flex-1 py-2 px-3 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--surface)] text-xs font-bold text-[var(--text)] transition cursor-pointer text-center"
                  >
                    Change Song 🎵
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProfileSong(undefined)}
                    className="py-2 px-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-500 hover:bg-red-500/20 transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                className="w-full py-3 px-3 rounded-xl border border-dashed border-[var(--line)] hover:border-pink-500/50 bg-[var(--surface-sunken)] hover:bg-pink-500/5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text)] hover:text-pink-400 transition cursor-pointer"
              >
                <Music size={15} />
                <span>+ Choose Favorite Song 🎵</span>
              </button>
            )}
          </div>
        </section>

        {/* Refer & Earn (+25 Points) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Gift size={13} className="text-pink-500" />
              <span>Refer & Earn (+25 Points)</span>
            </h2>
            <span className="text-[10px] text-emerald-500 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              +25 Pts Each
            </span>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4 space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">Invite Classmates</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  When a friend signs up with your referral code, both of you receive +25 points!
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shrink-0">
                <Gift size={20} />
              </div>
            </div>

            {/* Referral Code Box */}
            <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Your Referral Code
                </span>
                <span className="text-sm font-mono font-black text-[var(--primary)] block mt-0.5">
                  @{currentUser?.username || 'student'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyReferralLink}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white gradient-bg shadow-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95 transition"
              >
                {copiedRefLink ? (
                  <>
                    <Check size={13} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Referral Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Friends Joined
                </span>
                <span className="text-sm font-mono font-bold text-[var(--text)] mt-0.5 block">
                  👥 {currentUser?.referralCount || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                  Points Earned
                </span>
                <span className="text-sm font-mono font-bold text-amber-500 mt-0.5 block">
                  ⭐ {(currentUser?.referralCount || 0) * 25} pts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Admin Console Entry strictly for shashwath71845 */}
        {currentUser?.username?.toLowerCase() === 'shashwath71845' && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
              Super Administration
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--primary)] rounded-none p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={18} style={{ color: 'var(--primary)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  DPS Buzz Admin Center
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Full control over student activities: ban/unban, monitor & delete chats, publish official circulars, and schedule exams & calendar events.
              </p>
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-none bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              >
                <span>Launch Admin Console</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* Appearance (Theme Segmented Control) */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Appearance
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Theme</p>
              <p className="text-xs text-[var(--text-muted)]">
                Choose light, dark, or follow device settings.
              </p>
            </div>
            {/* Segmented Control per Section 9.7: sunken track, selected segment in --surface with 1px border */}
            <div className="grid grid-cols-3 p-1 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)]">
              {(['system', 'light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeChange(mode)}
                  className={`py-2 text-xs font-semibold rounded-[9px] transition-all cursor-pointer capitalize ${
                    theme === mode
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--line)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Apple Hello Greeting Preview Button */}
            <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--text)]">Apple &ldquo;Hello&rdquo; Welcome Screen</p>
                <p className="text-[11px] text-[var(--text-muted)]">Replay the entrance cursive greeting</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('dpsbuzz_replay_apple_hello'));
                  showToast('Replaying Apple "hello" greeting 👋');
                }}
                className="px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors btn-press cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderColor: 'var(--line)',
                  color: 'var(--text)',
                }}
              >
                Replay 👋
              </button>
            </div>
          </div>
        </section>

        {/* Mobile App & Direct Downloads */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Mobile App & Downloads
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Smartphone size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text)]">DPS Buzz Mobile</p>
                <p className="text-xs text-[var(--text-muted)]">
                  1-Tap Home Screen App (PWA) or Standalone APK
                </p>
              </div>
            </div>
            <Link
              href="/download"
              className="flex items-center justify-center gap-2 w-full h-10 rounded-[10px] gradient-bg text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
            >
              <Download size={14} />
              <span>Open Download Center</span>
            </Link>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Notifications
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] divide-y divide-[var(--line)] overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">School Notices</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Alerts for exams, circulars and urgent notices
                </p>
              </div>
              <input
                type="checkbox"
                checked={schoolNoticesNotif}
                onChange={(e) => setSchoolNoticesNotif(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
              />
            </div>
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Quiet Hours</p>
                <p className="text-xs text-[var(--text-muted)]">
                  No notifications from 9 pm to 7 am
                </p>
              </div>
              <input
                type="checkbox"
                checked={quietHours}
                onChange={(e) => setQuietHours(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* App Permissions (Camera, Gallery & Media) */}
        <section id="permissions-section" className="space-y-2 scroll-mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              App Permissions (Camera & Media) 📸
            </h2>
            <span className="text-[10px] text-pink-500 font-bold px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/20">
              Stories & Photos
            </span>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] divide-y divide-[var(--line)] overflow-hidden">
            {/* Camera Permission */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shrink-0">
                  <Camera size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">Camera Access</p>
                    {cameraPermissionGranted ? (
                      <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Allowed
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/20">
                        Tap to Allow
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Required to snap real-time stories, celebration photos, and profile pictures
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestCameraPermission}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white gradient-bg shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer shrink-0"
              >
                {cameraPermissionGranted ? 'Re-test 📸' : 'Allow Permission'}
              </button>
            </div>

            {/* Photos & Gallery Permission */}
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">Gallery & Media Storage</p>
                    <span className="text-[10px] text-emerald-500 font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Upload school project photos and habit snapshots from device files
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--line)] bg-[var(--surface-sunken)] hover:bg-[var(--card-hover)] transition cursor-pointer text-[var(--text)] shrink-0"
              >
                Test Gallery
              </button>
            </div>

            {/* Android Device Help Note */}
            <div className="p-3 bg-[var(--surface-sunken)]/60 text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1">
              <p className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <Smartphone size={13} className="text-blue-400" />
                How to enable in Android App Settings:
              </p>
              <p>
                Go to <span className="font-medium text-[var(--text)]">Phone Settings → Apps → DPS Buzz → Permissions → Camera & Photos</span> and choose <span className="text-pink-400 font-semibold">&ldquo;Allow while using the app&rdquo;</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy & Safety */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Privacy and Safety
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] divide-y divide-[var(--line)] overflow-hidden">
            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Read Receipts</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Let classmates see when you have read their messages
                </p>
              </div>
              <input
                type="checkbox"
                checked={readReceipts}
                onChange={(e) => setReadReceipts(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Private Account</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Only classmates you approve can see your posts
                </p>
              </div>
              <input
                type="checkbox"
                checked={privateAccount}
                onChange={(e) => setPrivateAccount(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)] rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => setShowBlockedSheet(true)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UserX size={18} className="text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text)]">Blocked accounts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-[var(--text-muted)]">{blockedUsers.length}</span>
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
              </div>
            </button>

            <button
              onClick={() => setShowPrivacySheet(true)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text)]">Privacy summary</span>
              </div>
              <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </button>

            <button
              onClick={() => setShowHelpSheet(true)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LifeBuoy size={18} className="text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]">Need help? (Helpline & Admin)</span>
              </div>
              <ChevronRight size={18} className="text-[var(--primary)]" />
            </button>
          </div>
        </section>

        {/* Account Actions */}
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Actions
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[16px] divide-y divide-[var(--line)] overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full p-3.5 flex items-center gap-2.5 text-left text-[var(--text)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
            >
              <LogOut size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium">Log out</span>
            </button>

            <button
              onClick={() => setShowDeleteSheet(true)}
              className="w-full p-3.5 flex items-center gap-2.5 text-left text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-colors cursor-pointer"
            >
              <Trash2 size={18} className="text-[var(--danger)]" />
              <span className="text-sm font-medium">Delete account</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-4 text-left space-y-1">
          <p className="text-xs font-semibold text-[var(--text)]">DPS Buzz</p>
          <p className="text-xs text-[var(--text-muted)]">
            Dilsukhnagar Public School student network.
          </p>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION SHEET */}
      {showDeleteSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border-t border-[var(--line)] rounded-t-[20px] p-6 space-y-4 animate-slide-up">
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center gap-2.5 text-[var(--danger)]">
              <AlertTriangle size={20} />
              <h3 className="text-base font-bold font-display">Delete account</h3>
            </div>
            {/* Exact copy from Section 11 */}
            <p className="text-sm text-[var(--text)] leading-relaxed">
              This removes your posts, stories and messages. It can't be undone.
            </p>
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleDeleteAccount}
                className="w-full h-12 rounded-[12px] bg-[var(--danger)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Delete permanently
              </button>
              <button
                onClick={() => setShowDeleteSheet(false)}
                className="w-full h-12 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--line)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEED HELP & HELPLINE SHEET (Section 12) */}
      {showHelpSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border-t border-[var(--line)] rounded-t-[20px] p-6 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text)] font-display">
                Safety and Help
              </h3>
              <button
                onClick={() => setShowHelpSheet(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-[12px] bg-[var(--primary-tint)] border border-[var(--primary)]/20 space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
                <Phone size={16} />
                <span>CHILDLINE India: 1098</span>
              </div>
              <p className="text-xs text-[var(--text)] leading-relaxed">
                If you ever feel unsafe, bullied, or need someone to talk to, call <strong>1098</strong>. It is free, confidential, and available 24/7 across India.
              </p>
            </div>

            <div className="space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
              <p className="font-semibold text-[var(--text)] text-sm">School Support</p>
              <p>
                You can report any message, post or profile by tapping the three dots (···) and selecting "Report". Reports are reviewed by school administrators.
              </p>
              <p>
                You can also speak with your class teacher or the school counselor during diary inspection or free periods.
              </p>
            </div>

            <button
              onClick={() => setShowHelpSheet(false)}
              className="w-full h-12 rounded-[12px] bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY SUMMARY SHEET (Section 12) */}
      {showPrivacySheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border-t border-[var(--line)] rounded-t-[20px] p-6 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text)] font-display">
                Privacy on DPS Buzz
              </h3>
              <button
                onClick={() => setShowPrivacySheet(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--text)] leading-relaxed">
              <div className="p-3 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)]">
                <p className="font-semibold mb-1">1. School-only access</p>
                <p className="text-[var(--text-muted)]">Only verified students from our school with a valid admission number can register. No strangers or public web crawlers.</p>
              </div>
              <div className="p-3 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)]">
                <p className="font-semibold mb-1">2. Zero tracking or advertisements</p>
                <p className="text-[var(--text-muted)]">We do not track your location, your phone number is not shared, and there are no commercial ads.</p>
              </div>
              <div className="p-3 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)]">
                <p className="font-semibold mb-1">3. Message Requests</p>
                <p className="text-[var(--text-muted)]">Messages from students you don't follow go to Requests first. No read receipt is sent until you accept.</p>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacySheet(false)}
              className="w-full h-12 rounded-[12px] bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* BLOCKED USERS SHEET */}
      {showBlockedSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-lg bg-[var(--surface)] border-t border-[var(--line)] rounded-t-[20px] p-6 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-9 h-1 rounded-full bg-[var(--line-strong)] mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text)] font-display">
                Blocked Accounts
              </h3>
              <button
                onClick={() => setShowBlockedSheet(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {blockedUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-6 text-left">
                You haven't blocked anyone.
              </p>
            ) : (
              <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-[12px] overflow-hidden">
                {blockedUsers.map((u) => (
                  <div key={u} className="p-3 flex items-center justify-between bg-[var(--surface)]">
                    <span className="text-xs font-semibold text-[var(--text)]">@{u}</span>
                    <button
                      onClick={() => unblockUser(u)}
                      className="px-2.5 py-1 rounded-[6px] text-xs font-semibold text-[var(--primary)] bg-[var(--primary-tint)] hover:opacity-80 cursor-pointer"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBlockedSheet(false)}
              className="w-full h-12 rounded-[12px] bg-[var(--surface-sunken)] border border-[var(--line)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--line)] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        onSelectSong={(track) => {
          handleUpdateProfileSong(track);
          setShowSongPicker(false);
        }}
        title="Select Profile Anthem 🎵"
      />
    </div>
  );
}
