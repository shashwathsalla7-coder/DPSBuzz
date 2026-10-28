'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Send,
  Image as ImageIcon,
  Type,
  Sparkles,
  Upload,
  Cake,
  PartyPopper,
  Camera,
  Trophy,
  Flame,
  Star,
  Check,
  Music,
  Disc3,
  RotateCcw,
  Zap,
  ZapOff,
  Smile,
  Clock,
  HelpCircle,
  MapPin,
  SlidersHorizontal,
  Layers,
  Plus,
  Palette,
  ChevronLeft,
  Settings,
  Scissors,
} from 'lucide-react';
import { textStoryPresets, TextStoryPreset } from '@/config/tokens';
import { DataStore, Profile, SongTrack } from '@/lib/dataStore';
import { SongPickerModal } from '@/components/music/SongPickerModal';
import { processImageForUpload } from '@/lib/imageProcessor';
import { globalAudio } from '@/lib/audioManager';

export interface StoryCreatorModalProps {
  isOpen: boolean;
  currentUser: Profile;
  onClose: () => void;
  onStoryCreated: () => void;
}

type Tab = 'camera' | 'gallery' | 'text' | 'celebrate';
type TemplateType = 'birthday' | 'goodluck' | 'congrats' | 'topscorer';

// Curated high-resolution school moment photos
const INITIAL_GALLERY_PHOTOS = [
  {
    id: 'g-1',
    label: '🔬 Science Expo',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    caption: 'Volcano model ready for judging! 🌋🧪 #DPSExpo',
  },
  {
    id: 'g-2',
    label: '🏏 Cricket Match',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    caption: 'Inter-house cricket semifinals! Go Cheetahs! 🏏🏆',
  },
  {
    id: 'g-3',
    label: '📚 Library Study',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    caption: 'Revision session before tomorrow\'s physics test 📚⚡',
  },
  {
    id: 'g-4',
    label: '🎨 Art & Culture',
    url: 'https://images.unsplash.com/photo-1460661419200-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    caption: 'Annual school art gallery exhibition! 🎨✨',
  },
  {
    id: 'g-5',
    label: '🏀 Basketball Semis',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    caption: 'Great fourth quarter comeback today! 🏀🔥',
  },
  {
    id: 'g-6',
    label: '🏫 Morning Assembly',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    caption: 'Morning assembly & sports day march-past practice 🏫✨',
  },
  {
    id: 'g-7',
    label: '🧪 Chemistry Lab',
    url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    caption: 'Salt analysis and titration practicals in Lab 2 🧪',
  },
  {
    id: 'g-8',
    label: '🏆 Trophy Showcase',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    caption: 'Champions of the inter-school tournament! 🏆🥇',
  },
];

// Sample classmates for quick birthday tagging
const SAMPLE_BIRTHDAY_STUDENTS = [
  {
    label: '👦 Aarav Reddy (8-B)',
    name: 'Aarav Reddy',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: '👧 Diya Sharma (7-A)',
    name: 'Diya Sharma',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: '👦 Kabir Verma (9-C)',
    name: 'Kabir Verma',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
];

// Instagram Filters
interface FilterOption {
  id: string;
  name: string;
  cssFilter: string;
  previewClass: string;
}

const INSTAGRAM_FILTERS: FilterOption[] = [
  { id: 'none', name: 'Normal', cssFilter: 'none', previewClass: 'bg-zinc-800' },
  { id: 'golden', name: 'Golden Hour', cssFilter: 'saturate(1.4) sepia(0.25) contrast(1.05)', previewClass: 'bg-gradient-to-tr from-amber-600 to-yellow-500' },
  { id: 'vintage', name: '90s Vintage', cssFilter: 'sepia(0.4) contrast(1.15) brightness(0.95)', previewClass: 'bg-gradient-to-tr from-amber-800 to-orange-700' },
  { id: 'tokyo', name: 'Tokyo B&W', cssFilter: 'grayscale(1) contrast(1.25)', previewClass: 'bg-gradient-to-tr from-neutral-800 to-zinc-600' },
  { id: 'cyber', name: 'Cyber Neon', cssFilter: 'contrast(1.3) saturate(1.8) hue-rotate(35deg)', previewClass: 'bg-gradient-to-tr from-fuchsia-600 to-cyan-500' },
  { id: 'drama', name: 'Soft Drama', cssFilter: 'contrast(1.2) brightness(0.9) saturate(1.2)', previewClass: 'bg-gradient-to-tr from-rose-700 to-purple-800' },
  { id: 'emerald', name: 'Cool Emerald', cssFilter: 'hue-rotate(60deg) saturate(1.2)', previewClass: 'bg-gradient-to-tr from-emerald-600 to-teal-500' },
];

// Useful School Stickers for Students
interface UsefulSticker {
  id: string;
  type: 'countdown' | 'doubt' | 'streak' | 'location';
  title: string;
  subtitle?: string;
  badgeClass: string;
  icon: string;
}

const USEFUL_STUDENT_STICKERS: UsefulSticker[] = [
  {
    id: 'st-exam',
    type: 'countdown',
    title: '⏰ Mid-Term Exams',
    subtitle: '5 Days Left • Revision Mode',
    badgeClass: 'bg-rose-500/90 text-white shadow-md border border-white/20',
    icon: '⏰',
  },
  {
    id: 'st-sports',
    type: 'countdown',
    title: '🏆 Sports Day Finals',
    subtitle: 'Tomorrow at 9:00 AM',
    badgeClass: 'bg-amber-500/90 text-white shadow-md border border-white/20',
    icon: '🏆',
  },
  {
    id: 'st-physics',
    type: 'doubt',
    title: '❓ Physics Doubt (Class 8)',
    subtitle: 'Can anyone explain Q4 formula?',
    badgeClass: 'bg-indigo-600/90 text-white shadow-md border border-white/20',
    icon: '❓',
  },
  {
    id: 'st-math',
    type: 'doubt',
    title: '📐 Math Geometry Doubt',
    subtitle: 'Circle theorem notes needed',
    badgeClass: 'bg-blue-600/90 text-white shadow-md border border-white/20',
    icon: '📐',
  },
  {
    id: 'st-streak',
    type: 'streak',
    title: '🔥 7-Day Study Streak',
    subtitle: 'DPS Star Board Contender',
    badgeClass: 'bg-orange-600/90 text-white shadow-md border border-white/20',
    icon: '🔥',
  },
  {
    id: 'st-lib',
    type: 'location',
    title: '📍 DPS Central Library',
    subtitle: 'Quiet Study Session',
    badgeClass: 'bg-emerald-600/90 text-white shadow-md border border-white/20',
    icon: '📍',
  },
  {
    id: 'st-lab',
    type: 'location',
    title: '📍 Science Lab 2',
    subtitle: 'Practical Demo',
    badgeClass: 'bg-teal-600/90 text-white shadow-md border border-white/20',
    icon: '📍',
  },
  {
    id: 'st-ground',
    type: 'location',
    title: '📍 School Sports Ground',
    subtitle: 'Cheetahs House Practice',
    badgeClass: 'bg-yellow-600/90 text-white shadow-md border border-white/20',
    icon: '📍',
  },
];

const TEXT_COLORS = ['#FFFFFF', '#FFE600', '#FF3B80', '#00E5FF', '#00FF66', '#FF6600', '#B026FF', '#121212'];

const BLOCKED_WORDS = ['abuse', 'badword', 'curse', 'slur', 'hate'];
function checkProfanity(val: string): boolean {
  const lower = val.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onStoryCreated,
}) => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('gallery');

  // Photo Canvas State
  const [photoUrl, setPhotoUrl] = useState<string>(INITIAL_GALLERY_PHOTOS[0].url);
  const [galleryPhotos, setGalleryPhotos] = useState(INITIAL_GALLERY_PHOTOS);
  const [isPhotoEditing, setIsPhotoEditing] = useState(true);

  // Instagram Effects & Filters
  const [activeFilterId, setActiveFilterId] = useState<string>('none');
  const [showFiltersBar, setShowFiltersBar] = useState(false);

  // Instagram Story Text Overlay (Aa)
  const [customText, setCustomText] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgStyle, setTextBgStyle] = useState<'none' | 'fill' | 'semi'>('fill');
  const [textFont, setTextFont] = useState<'classic' | 'bold' | 'neon' | 'typewriter'>('bold');

  // Useful Student Stickers
  const [activeSticker, setActiveSticker] = useState<UsefulSticker | null>(null);
  const [showStickersSheet, setShowStickersSheet] = useState(false);

  // Music & Soundtrack State
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [showSongPicker, setShowSongPicker] = useState(false);

  // Camera Hardware State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement>(null);

  // Birthday & Celebration Mode State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('birthday');
  const [templateName, setTemplateName] = useState('Aarav Reddy (8-B)');
  const [templatePhotoUrl, setTemplatePhotoUrl] = useState(SAMPLE_BIRTHDAY_STUDENTS[0].url);
  const [templateWish, setTemplateWish] = useState('Wishing you a fantastic 14th birthday! Have a blast! 🎂🎉');

  // Stop music when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      globalAudio.stop();
    }
    return () => {
      globalAudio.stop();
    };
  }, [isOpen]);

  // Text & Gradient Mode State
  const [selectedPreset, setSelectedPreset] = useState<TextStoryPreset>(textStoryPresets[0]);
  const [text, setText] = useState('Studying hard for Unit Tests! Let\'s ace this together 📚🔥');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active user details
  const activeUsername = currentUser?.username || 'student';
  const activeFullName = currentUser?.fullName || 'Student';

  // Stop camera helper
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start live camera
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access not available. Tap to use device photo capture.');
      setCameraActive(false);
    }
  }, [stopCameraStream]);

  // Handle switching tabs
  useEffect(() => {
    if (tab === 'camera') {
      startCamera(cameraFacing);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [tab, cameraFacing, startCamera, stopCameraStream]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
  }, [isOpen, stopCameraStream]);

  if (!isOpen) return null;

  // Capture snapshot from live camera viewfinder
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      // Fallback: trigger native file camera
      cameraFallbackInputRef.current?.click();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If user camera, mirror horizontal for natural selfie feel
      if (cameraFacing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoUrl(dataUrl);
      setIsPhotoEditing(true);
      stopCameraStream();
      setTab('gallery');
    }
  };

  // Device file loader with client-side canvas compression (max 1080px, WebP ~150KB)
  const handleDevicePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    try {
      const processed = await processImageForUpload(file, 1080, 0.82);
      const compressedDataUrl = processed.previewUrl;
      setPhotoUrl(compressedDataUrl);
      // Prepend to gallery photos list
      setGalleryPhotos((prev) => [
        {
          id: `user-upload-${Date.now()}`,
          label: '📱 My Photo',
          url: compressedDataUrl,
          caption: '',
        },
        ...prev,
      ]);
      setIsPhotoEditing(true);
      setTab('gallery');
      stopCameraStream();
      setError(null);
    } catch {
      setError('Failed to process image. Please try another photo.');
    }
  };

  // Submission Handlers
  const handleShare = async () => {
    setError(null);

    if (tab === 'gallery' || tab === 'camera') {
      const url = photoUrl.trim();
      if (!url) {
        setError('Please choose or upload a story photo.');
        return;
      }
      if (customText && checkProfanity(customText)) {
        setError('Please keep your caption school-appropriate.');
        return;
      }

      setIsSubmitting(true);
      try {
        let finalUrl = url;
        if (url.startsWith('data:image/')) {
          try {
            const upRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dataUrl: url, folder: 'stories' }),
            });
            if (upRes.ok) {
              const upData = await upRes.json();
              if (upData.success && upData.url) {
                finalUrl = upData.url;
              }
            }
          } catch (e) {
            console.warn('Story image upload fallback to data URL:', e);
          }
        }

        const stickersToSave = activeSticker
          ? [
              {
                type: activeSticker.type,
                title: activeSticker.title,
                subtitle: activeSticker.subtitle,
                color: activeSticker.badgeClass,
              },
            ]
          : undefined;

        const created = DataStore.addStory({
          userId: currentUser.id || 'user-me',
          username: activeUsername,
          fullName: activeFullName,
          avatar: currentUser.avatar,
          imageUrl: finalUrl,
          text: customText.trim() || undefined,
          background: '#0F131B',
          textColor: textColor,
          song: selectedSong || undefined,
          filter: activeFilterId !== 'none' ? INSTAGRAM_FILTERS.find((f) => f.id === activeFilterId)?.cssFilter : undefined,
          stickers: stickersToSave,
          textStyle: customText
            ? {
                color: textColor,
                bgStyle: textBgStyle,
                font: textFont,
              }
            : undefined,
        });

        // Await server persistence to Supabase so story is immediately visible across all devices
        try {
          await fetch('/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: created }),
            keepalive: true,
          });
        } catch (syncErr) {
          console.warn('Server story sync failed:', syncErr);
        }

        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        onStoryCreated();
        onClose();
      } catch {
        setError('Could not share story. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (tab === 'celebrate') {
      const name = templateName.trim();
      if (!name) {
        setError('Please enter the name of the classmate to celebrate.');
        return;
      }
      if (checkProfanity(name)) {
        setError('Please enter an appropriate classmate name.');
        return;
      }
      const wish = templateWish.trim();
      if (wish && checkProfanity(wish)) {
        setError('Please keep your message school-appropriate.');
        return;
      }

      setIsSubmitting(true);
      try {
        const created = DataStore.addStory({
          userId: currentUser.id || 'user-me',
          username: activeUsername,
          fullName: activeFullName,
          avatar: currentUser.avatar,
          template: selectedTemplate,
          templateData: {
            name,
            extra: templatePhotoUrl.trim() || undefined,
          },
          text: wish || undefined,
          background: '#1A0E2E',
          textColor: '#FFFFFF',
          song: selectedSong || undefined,
        });

        try {
          await fetch('/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: created }),
            keepalive: true,
          });
        } catch (syncErr) {
          console.warn('Server story sync failed:', syncErr);
        }

        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        onStoryCreated();
        onClose();
      } catch {
        setError('Could not share celebration story. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Text mode
      const trimmed = text.trim();
      if (!trimmed) {
        setError('Please type a message before sharing.');
        return;
      }
      if (checkProfanity(trimmed)) {
        setError('Please keep your text school-appropriate.');
        return;
      }

      setIsSubmitting(true);
      try {
        const created = DataStore.addStory({
          userId: currentUser.id || 'user-me',
          username: activeUsername,
          fullName: activeFullName,
          avatar: currentUser.avatar,
          text: trimmed,
          background: selectedPreset.background,
          textColor: selectedPreset.textColor,
          song: selectedSong || undefined,
        });

        try {
          await fetch('/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: created }),
            keepalive: true,
          });
        } catch (syncErr) {
          console.warn('Server story sync failed:', syncErr);
        }

        window.dispatchEvent(new CustomEvent('dpsbuzz:content_updated'));
        onStoryCreated();
        onClose();
      } catch {
        setError('Could not share text story. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const activeCssFilter = INSTAGRAM_FILTERS.find((f) => f.id === activeFilterId)?.cssFilter || 'none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Story Creator"
    >
      {/* Hidden processing canvas & file pickers */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDevicePhotoChange}
        className="hidden"
      />
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleDevicePhotoChange}
        className="hidden"
      />

      {/* Main Instagram Story Frame */}
      <div
        className="relative w-full max-w-[420px] h-[100dvh] sm:h-[92vh] sm:rounded-[32px] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.60)] border bg-black border-white/10"
      >
        {/* Top Header Mode Tabs & Exit */}
        <div
          className="absolute top-0 inset-x-0 z-30 px-4 pb-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px) + 16px, 54px)',
          }}
        >
          <div className="flex items-center gap-1 p-1 rounded-full bg-black/65 backdrop-blur-md border border-white/25 text-white text-xs shadow-md">
            <button
              type="button"
              onClick={() => { setTab('camera'); setIsPhotoEditing(false); }}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'camera' ? 'bg-white text-black shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              <Camera size={14} />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('gallery'); }}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'gallery' ? 'bg-white text-black shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              <ImageIcon size={14} />
              <span>Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('text'); }}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'text' ? 'bg-white text-black shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              <Type size={14} />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('celebrate'); }}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                tab === 'celebrate' ? 'bg-white text-black shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              <Cake size={14} />
              <span>Party</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/70 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer active:scale-95 shadow-lg"
            aria-label="Close story creator"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── 1. CAMERA VIEWFINDER MODE ─────────────────────────────────── */}
        {tab === 'camera' && (
          <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-hidden bg-black">
            {/* Live Video Feed */}
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/70">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Camera size={32} className="text-white/60" />
                </div>
                <p className="text-sm font-semibold mb-1">Camera Permissions Needed</p>
                <p className="text-xs text-white/50 max-w-xs mb-4">
                  {cameraError || 'Allow camera permission to shoot stories and live moments.'}
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      onClose();
                      router.push('/settings?tab=permissions');
                    }}
                    className="w-full py-2.5 px-4 rounded-full text-xs font-bold text-white gradient-bg shadow-md flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer active:scale-95 transition"
                  >
                    <Settings size={14} />
                    <span>Tap to Allow in Settings ⚙️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraFallbackInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 hover:bg-white/25 cursor-pointer transition"
                  >
                    Open Phone Camera
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Camera Controls (Instagram Style) */}
            <div
              className="relative z-20 mt-auto px-6 pt-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 60px)',
              }}
            >
              {/* Quick Gallery Thumbnail Box */}
              <button
                type="button"
                onClick={() => setTab('gallery')}
                className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/40 shadow-lg cursor-pointer hover:scale-105 transition shrink-0"
                title="Open Gallery boxes"
                aria-label="Open photo gallery"
              >
                <img
                  src={galleryPhotos[0]?.url || INITIAL_GALLERY_PHOTOS[0].url}
                  alt="Recent gallery"
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Instagram Big Shutter Button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="w-20 h-20 rounded-full p-1 border-4 border-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-2xl"
                  aria-label="Take photo"
                >
                  <div className="w-full h-full rounded-full bg-white active:bg-white/70 transition-colors" />
                </button>
              </div>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={() => {
                  const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
                  setCameraFacing(nextFacing);
                  startCamera(nextFacing);
                }}
                className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                title="Flip Camera"
                aria-label="Flip front or back camera"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        )}

        {/* ─── 2. INSTAGRAM GALLERY & CANVAS EDITOR ──────────────────────── */}
        {tab === 'gallery' && (
          <div className="relative flex-1 w-full h-full flex flex-col justify-between overflow-y-auto overscroll-contain bg-[#0A0D14]">
            {/* Active Story Photo Canvas */}
            <div className="relative flex-1 w-full min-h-[300px] flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={photoUrl}
                alt="Story photo preview"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                style={{ filter: activeCssFilter }}
              />

              {/* Gradient Scrim for readable overlay */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* Top Floating Instagram Tool Buttons (Aa, Music, Filters, Stickers) */}
              <div
                className="absolute inset-x-0 z-20 px-4 flex items-center justify-end gap-2"
                style={{
                  top: 'max(env(safe-area-inset-top, 0px) + 64px, 88px)',
                }}
              >
                {/* 1. Write Text (Aa) */}
                <button
                  type="button"
                  onClick={() => setShowTextModal(true)}
                  className="px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 cursor-pointer shadow-md"
                  aria-label="Add text to story"
                >
                  <span className="font-serif font-black text-sm">Aa</span>
                  <span className="hidden sm:inline">Text</span>
                </button>

                {/* 2. Add Music (🎵) */}
                <button
                  type="button"
                  onClick={() => setShowSongPicker(true)}
                  className={`px-2.5 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition ${
                    selectedSong
                      ? 'bg-pink-600/90 border-pink-400 text-white'
                      : 'bg-black/60 border-white/20 text-white hover:bg-white/20'
                  }`}
                  aria-label="Add music track"
                >
                  <Music size={14} className={selectedSong ? 'animate-pulse' : ''} />
                  <span>{selectedSong ? 'Music' : 'Music'}</span>
                </button>

                {/* 3. Instagram Effects / Filters (✨) */}
                <button
                  type="button"
                  onClick={() => setShowFiltersBar((p) => !p)}
                  className={`p-2 rounded-full backdrop-blur-md border text-white cursor-pointer shadow-md transition ${
                    activeFilterId !== 'none' || showFiltersBar
                      ? 'bg-amber-500/90 border-amber-300'
                      : 'bg-black/60 border-white/20 hover:bg-white/20'
                  }`}
                  title="Photo Filters"
                  aria-label="Instagram photo filters"
                >
                  <Sparkles size={16} />
                </button>

                {/* 4. Useful Student Stickers (🏷️) */}
                <button
                  type="button"
                  onClick={() => setShowStickersSheet((p) => !p)}
                  className={`p-2 rounded-full backdrop-blur-md border text-white cursor-pointer shadow-md transition ${
                    activeSticker || showStickersSheet
                      ? 'bg-indigo-600/90 border-indigo-300'
                      : 'bg-black/60 border-white/20 hover:bg-white/20'
                  }`}
                  title="Useful Student Stickers"
                  aria-label="Add student stickers"
                >
                  <Smile size={16} />
                </button>
              </div>

              {/* On-Canvas Attached Elements */}
              <div className="absolute inset-0 z-10 pointer-events-none p-5 flex flex-col justify-between">
                {/* Top Left: Attached Music Sticker */}
                <div className="pt-24 space-y-2">
                  {selectedSong && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white shadow-xl animate-fade-in pointer-events-auto">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-pink-500/20 flex items-center justify-center shrink-0">
                        {selectedSong.artworkUrl ? (
                          <img src={selectedSong.artworkUrl} alt={selectedSong.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music size={11} className="text-pink-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold truncate max-w-[130px]">{selectedSong.title}</span>
                      <span className="text-[10px] text-white/70 truncate max-w-[80px]">• {selectedSong.artist}</span>
                      {selectedSong.startTime !== undefined && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-300 font-mono font-bold shrink-0">
                          {Math.floor(selectedSong.startTime / 60)}:{Math.floor(selectedSong.startTime % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      <div className="flex items-end gap-0.5 h-3 ml-0.5 shrink-0">
                        <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-3" />
                        <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-2" />
                        <span className="w-0.5 bg-pink-400 rounded-full animate-pulse h-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSongPicker(true)}
                        className="ml-1 text-pink-300 hover:text-white cursor-pointer p-0.5"
                        title="Choose Part / Main Chorus"
                        aria-label="Choose song part"
                      >
                        <Scissors size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSong(null)}
                        className="text-white/60 hover:text-white cursor-pointer"
                        aria-label="Remove music"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Attached Useful Student Sticker */}
                  {activeSticker && (
                    <div className={`p-2.5 rounded-2xl ${activeSticker.badgeClass} max-w-[260px] animate-fade-in pointer-events-auto flex items-start gap-2.5 shadow-xl`}>
                      <span className="text-xl shrink-0 select-none">{activeSticker.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold leading-tight truncate">{activeSticker.title}</p>
                        {activeSticker.subtitle && (
                          <p className="text-[10px] text-white/80 leading-tight mt-0.5 truncate">{activeSticker.subtitle}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSticker(null)}
                        className="text-white/70 hover:text-white cursor-pointer ml-1"
                        aria-label="Remove sticker"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Center / Lower-Center: Custom Aa Text Overlay */}
                {customText && (
                  <div className="text-center my-auto px-4 pointer-events-auto animate-fade-in">
                    <span
                      onClick={() => setShowTextModal(true)}
                      className={`inline-block text-lg sm:text-xl leading-snug cursor-pointer transition select-none ${
                        textBgStyle === 'fill'
                          ? 'px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md shadow-xl'
                          : textBgStyle === 'semi'
                          ? 'px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm'
                          : 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]'
                      } ${
                        textFont === 'bold'
                          ? 'font-black tracking-tight'
                          : textFont === 'neon'
                          ? 'font-mono font-bold tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]'
                          : textFont === 'typewriter'
                          ? 'font-mono font-medium'
                          : 'font-sans font-bold'
                      }`}
                      style={{ color: textColor }}
                    >
                      {customText}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Instagram Filter Carousel (Toggled by ✨) */}
            {showFiltersBar && (
              <div className="relative z-30 px-3 py-2 bg-black/90 backdrop-blur-md border-t border-white/10 flex items-center gap-3 overflow-x-auto no-scrollbar animate-slide-up">
                {INSTAGRAM_FILTERS.map((f) => {
                  const isSel = activeFilterId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilterId(f.id)}
                      className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-xl transition cursor-pointer ${
                        isSel ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${f.previewClass} border border-white/30 flex items-center justify-center text-[10px] text-white font-bold`}>
                        {f.name.slice(0, 1)}
                      </div>
                      <span className="text-[10px] text-white font-medium">{f.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom Gallery Box Grid (Instagram Recent Photos) */}
            <div
              className="relative z-20 bg-black/95 border-t border-white/10 p-3 flex flex-col gap-2.5 shrink-0"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 20px, 60px)',
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                  Gallery Roll & Moments
                </span>
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="text-xs text-brand-pink font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Device Photos</span>
                </button>
              </div>

              {/* Thumbnail Boxes Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-x-auto max-h-[105px] overflow-y-hidden pb-1">
                {/* Box 1: Device Upload Box */}
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-white/80 transition cursor-pointer active:scale-95"
                  title="Upload from device gallery"
                  aria-label="Upload photo from phone"
                >
                  <Upload size={16} />
                  <span className="text-[9px] font-bold">Upload</span>
                </button>

                {/* Box 2..N: Gallery Photo Boxes */}
                {galleryPhotos.map((item) => {
                  const isSel = photoUrl === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(item.url);
                        setError(null);
                      }}
                      className={`aspect-square rounded-xl overflow-hidden relative border-2 transition cursor-pointer active:scale-95 ${
                        isSel ? 'border-white ring-2 ring-brand-pink' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      aria-label={`Select photo ${item.label}`}
                    >
                      <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                      {isSel && (
                        <div className="absolute inset-0 bg-brand-pink/20 flex items-center justify-center">
                          <Check size={14} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Story Share Action Button */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTextModal(true)}
                  className="px-3 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/15"
                >
                  {customText ? 'Edit Caption ✏️' : 'Add Caption 💬'}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-full text-xs font-extrabold text-white gradient-bg hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Posting Story...' : 'Share to School Story 🚀'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. TEXT & GRADIENT STORY MODE ─────────────────────────────── */}
        {tab === 'text' && (
          <div
            className="relative flex-1 w-full h-full flex flex-col justify-between p-6 select-none transition-colors duration-300 overflow-y-auto"
            style={{
              background: selectedPreset.background,
              paddingTop: 'max(env(safe-area-inset-top, 0px) + 64px, 88px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 60px)',
            }}
          >
            {/* Top Toolbar */}
            <div className="pt-14 flex items-center justify-between text-white/90">
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
              >
                <Music size={13} />
                <span>{selectedSong ? selectedSong.title : 'Add Music'}</span>
              </button>
            </div>

            {/* Big Centered Text Input */}
            <div className="my-auto text-center px-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your story thought..."
                rows={4}
                maxLength={150}
                className="w-full bg-transparent text-center text-2xl sm:text-3xl font-black outline-none resize-none leading-snug drop-shadow-md placeholder:text-white/40"
                style={{ color: selectedPreset.textColor, fontFamily: 'var(--font-display)' }}
                autoFocus
              />
              <p className="text-[11px] text-white/60 font-mono mt-2">{text.length}/150 chars</p>
            </div>

            {/* Bottom Gradient Presets & Share */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center overflow-x-auto py-1">
                {textStoryPresets.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPreset(pr)}
                    className={`w-9 h-9 rounded-full shrink-0 border-2 transition cursor-pointer ${
                      selectedPreset.id === pr.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-75'
                    }`}
                    style={{ background: pr.background }}
                    aria-label={pr.name}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleShare}
                disabled={isSubmitting || !text.trim()}
                className="w-full py-3 rounded-full text-xs font-extrabold text-white gradient-bg hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Posting...' : 'Share Text Story 🚀'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── 4. CELEBRATE & BIRTHDAY MODE ──────────────────────────────── */}
        {tab === 'celebrate' && (
          <div
            className="relative flex-1 w-full h-full flex flex-col justify-between p-6 bg-gradient-to-br from-[#1E1035] via-[#2B0938] to-[#0F0720] overflow-y-auto"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px) + 64px, 88px)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 24px, 60px)',
            }}
          >
            <div className="pt-14 space-y-4">
              <div className="text-center text-white">
                <span className="text-3xl">🎂</span>
                <h3 className="text-base font-extrabold mt-1">Celebrate a Classmate</h3>
                <p className="text-xs text-white/60">Share birthdays, wins, or good luck wishes!</p>
              </div>

              {/* Template Classmate Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/80 uppercase">Student Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Aarav Reddy (8-B)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-brand-pink"
                />
              </div>

              {/* Wish Message */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/80 uppercase">Wish Message</label>
                <textarea
                  rows={3}
                  value={templateWish}
                  onChange={(e) => setTemplateWish(e.target.value)}
                  placeholder="Wishing you a fantastic 14th birthday! 🎂🎉"
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs outline-none focus:border-brand-pink resize-none"
                />
              </div>

              {/* Quick Classmate Photo Pick */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/80 uppercase">Quick Photo</label>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_BIRTHDAY_STUDENTS.map((st) => (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => {
                        setTemplateName(st.name);
                        setTemplatePhotoUrl(st.url);
                      }}
                      className="p-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 text-center flex flex-col items-center gap-1 cursor-pointer transition"
                    >
                      <img src={st.url} alt={st.name} className="w-10 h-10 rounded-full object-cover" />
                      <span className="text-[10px] text-white truncate max-w-full">{st.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Celebrate Actions */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => setShowSongPicker(true)}
                className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-white/15"
              >
                <Music size={14} />
                <span>{selectedSong ? `Music: ${selectedSong.title}` : 'Add Birthday Song 🎵'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={isSubmitting}
                className="w-full py-3 rounded-full text-xs font-extrabold text-white gradient-bg hover:opacity-90 active:scale-98 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <PartyPopper size={14} />
                <span>{isSubmitting ? 'Posting...' : 'Share Celebration Story 🎉'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="absolute bottom-20 inset-x-4 z-40 p-3 rounded-2xl bg-rose-600/90 text-white text-xs font-bold text-center shadow-2xl animate-fade-in">
            {error}
          </div>
        )}
      </div>

      {/* ─── MODAL 1: INSTAGRAM WRITE TEXT (Aa) ─────────────────────────── */}
      {showTextModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col justify-between p-6 animate-fade-in"
          onClick={() => setShowTextModal(false)}
        >
          <div className="flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
            {/* Font Style Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/10 border border-white/20">
              {(['bold', 'classic', 'neon', 'typewriter'] as const).map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => setTextFont(font)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition cursor-pointer ${
                    textFont === font ? 'bg-white text-black' : 'text-white/70'
                  }`}
                >
                  {font}
                </button>
              ))}
            </div>

            {/* Background Style Toggle */}
            <button
              type="button"
              onClick={() => {
                setTextBgStyle((prev) => (prev === 'fill' ? 'semi' : prev === 'semi' ? 'none' : 'fill'));
              }}
              className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Palette size={14} />
              <span>{textBgStyle === 'fill' ? 'Solid Box' : textBgStyle === 'semi' ? 'Glass Box' : 'Clean'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTextModal(false)}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-extrabold cursor-pointer"
            >
              Done
            </button>
          </div>

          {/* Big Story Input Field */}
          <div className="my-auto text-center px-4" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your story caption..."
              rows={3}
              maxLength={120}
              className={`w-full bg-transparent text-center text-2xl sm:text-3xl font-black outline-none resize-none leading-snug drop-shadow-md placeholder:text-white/30 ${
                textFont === 'neon'
                  ? 'font-mono'
                  : textFont === 'typewriter'
                  ? 'font-mono font-medium'
                  : 'font-sans'
              }`}
              style={{ color: textColor }}
              autoFocus
            />
          </div>

          {/* Color Palette */}
          <div className="flex items-center justify-center gap-3 overflow-x-auto py-2" onClick={(e) => e.stopPropagation()}>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTextColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition cursor-pointer ${
                  textColor === c ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-80'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: USEFUL STUDENT STICKERS SHEET ─────────────────────── */}
      {showStickersSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowStickersSheet(false)}
        >
          <div
            className="w-full max-w-[380px] bg-[#12141C] border border-white/15 rounded-t-[28px] sm:rounded-[28px] overflow-hidden p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Smile size={18} className="text-indigo-400" />
                <h3 className="text-sm font-bold">Useful Student Stickers</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStickersSheet(false)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Tap any sticker to display it on your story for your classmates!
            </p>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {USEFUL_STUDENT_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => {
                    setActiveSticker(stk);
                    setShowStickersSheet(false);
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition cursor-pointer border hover:scale-[1.01] ${stk.badgeClass}`}
                >
                  <span className="text-2xl select-none shrink-0">{stk.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black truncate">{stk.title}</p>
                    {stk.subtitle && (
                      <p className="text-[10px] text-white/80 truncate mt-0.5">{stk.subtitle}</p>
                    )}
                  </div>
                  <Plus size={16} className="text-white/80 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: SONG PICKER MODAL (30s Free Apple Previews) ───────── */}
      <SongPickerModal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        initialTrack={selectedSong || undefined}
        onSelectSong={(song) => {
          setSelectedSong(song);
          setShowSongPicker(false);
        }}
        title="Add Music to Story 🎵"
      />
    </div>
  );
};

export default StoryCreatorModal;
