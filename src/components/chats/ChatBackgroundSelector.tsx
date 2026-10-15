'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Check,
  Upload,
  Sparkles,
  Palette,
  Image as ImageIcon,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';

export interface ChatBackgroundOption {
  id: string;
  name: string;
  type: 'gradient' | 'image' | 'default';
  value: string; // CSS background value or image URL
  preview: string; // CSS background or image thumbnail URL
  textColor?: 'light' | 'dark';
}

export const GRADIENT_BACKGROUNDS: ChatBackgroundOption[] = [
  {
    id: 'default',
    name: 'Default Clean',
    type: 'default',
    value: 'var(--surface)',
    preview: 'linear-gradient(180deg, #18181b 0%, #121215 100%)',
    textColor: 'light',
  },
  {
    id: 'sunset_vibe',
    name: 'Sunset Glow',
    type: 'gradient',
    value: 'linear-gradient(145deg, #4c0519 0%, #831843 35%, #be123c 65%, #f97316 100%)',
    preview: 'linear-gradient(145deg, #4c0519 0%, #831843 35%, #be123c 65%, #f97316 100%)',
    textColor: 'light',
  },
  {
    id: 'midnight_nebula',
    name: 'Midnight Nebula',
    type: 'gradient',
    value: 'linear-gradient(135deg, #050508 0%, #0f172a 40%, #1e1b4b 75%, #312e81 100%)',
    preview: 'linear-gradient(135deg, #050508 0%, #0f172a 40%, #1e1b4b 75%, #312e81 100%)',
    textColor: 'light',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyberpunk Neon',
    type: 'gradient',
    value: 'linear-gradient(135deg, #09090b 0%, #3b0764 45%, #0369a1 85%, #06b6d4 100%)',
    preview: 'linear-gradient(135deg, #09090b 0%, #3b0764 45%, #0369a1 85%, #06b6d4 100%)',
    textColor: 'light',
  },
  {
    id: 'emerald_aurora',
    name: 'Emerald Aurora',
    type: 'gradient',
    value: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #047857 75%, #10b981 100%)',
    preview: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #047857 75%, #10b981 100%)',
    textColor: 'light',
  },
  {
    id: 'candy_pop',
    name: 'Candy Pop',
    type: 'gradient',
    value: 'linear-gradient(135deg, #701a75 0%, #a21caf 40%, #c026d3 70%, #ec4899 100%)',
    preview: 'linear-gradient(135deg, #701a75 0%, #a21caf 40%, #c026d3 70%, #ec4899 100%)',
    textColor: 'light',
  },
  {
    id: 'ocean_depths',
    name: 'Ocean Depths',
    type: 'gradient',
    value: 'linear-gradient(145deg, #082f49 0%, #0369a1 40%, #0284c7 75%, #38bdf8 100%)',
    preview: 'linear-gradient(145deg, #082f49 0%, #0369a1 40%, #0284c7 75%, #38bdf8 100%)',
    textColor: 'light',
  },
  {
    id: 'amethyst_dream',
    name: 'Amethyst Dream',
    type: 'gradient',
    value: 'linear-gradient(140deg, #2e1065 0%, #581c87 40%, #7e22ce 75%, #a855f7 100%)',
    preview: 'linear-gradient(140deg, #2e1065 0%, #581c87 40%, #7e22ce 75%, #a855f7 100%)',
    textColor: 'light',
  },
  {
    id: 'solar_amber',
    name: 'Solar Amber',
    type: 'gradient',
    value: 'linear-gradient(145deg, #451a03 0%, #78350f 40%, #b45309 75%, #f59e0b 100%)',
    preview: 'linear-gradient(145deg, #451a03 0%, #78350f 40%, #b45309 75%, #f59e0b 100%)',
    textColor: 'light',
  },
  {
    id: 'titanium_dark',
    name: 'Titanium Dark',
    type: 'gradient',
    value: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
    preview: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
    textColor: 'light',
  },
];

export const GALLERY_BACKGROUNDS: ChatBackgroundOption[] = [
  {
    id: 'gallery_stars',
    name: 'Cosmic Galaxy',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_city',
    name: 'Neon City Night',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_forest',
    name: 'Misty Pines',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_lofi',
    name: 'Cozy Study Room',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_rain',
    name: 'Raindrops on Glass',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_blossom',
    name: 'Cherry Blossoms',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_dunes',
    name: 'Desert Dunes',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
  {
    id: 'gallery_aurora',
    name: 'Northern Lights',
    type: 'image',
    value: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=80',
    preview: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=300&q=70',
    textColor: 'light',
  },
];

export interface ChatBackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground: ChatBackgroundOption | null;
  onSelectBackground: (bg: ChatBackgroundOption, applyToAll?: boolean) => void;
  conversationName?: string;
}

export function ChatBackgroundSelector({
  isOpen,
  onClose,
  currentBackground,
  onSelectBackground,
  conversationName = 'Chat',
}: ChatBackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<'gradients' | 'gallery'>('gradients');
  const [selectedBg, setSelectedBg] = useState<ChatBackgroundOption>(
    currentBackground || GRADIENT_BACKGROUNDS[0]
  );
  const [applyToAll, setApplyToAll] = useState(false);
  const [customPhoto, setCustomPhoto] = useState<ChatBackgroundOption | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync selectedBg when currentBackground prop changes
  React.useEffect(() => {
    if (currentBackground) {
      setSelectedBg(currentBackground);
      if (currentBackground.type === 'image') {
        setActiveTab('gallery');
      }
    }
  }, [currentBackground, isOpen]);

  if (!isOpen) return null;

  // Handle custom gallery photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file from your device gallery.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploading(false);
        return;
      }

      // Compress to max 1280px via HTML5 Canvas
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);

            const customOption: ChatBackgroundOption = {
              id: `custom_${Date.now()}`,
              name: 'My Custom Photo',
              type: 'image',
              value: compressed,
              preview: compressed,
              textColor: 'light',
            };

            setCustomPhoto(customOption);
            setSelectedBg(customOption);
            setActiveTab('gallery');
          }
        } catch {
          const fallbackOption: ChatBackgroundOption = {
            id: `custom_${Date.now()}`,
            name: 'My Custom Photo',
            type: 'image',
            value: dataUrl,
            preview: dataUrl,
            textColor: 'light',
          };
          setCustomPhoto(fallbackOption);
          setSelectedBg(fallbackOption);
          setActiveTab('gallery');
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => setIsUploading(false);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    onSelectBackground(selectedBg, applyToAll);
    onClose();
  };

  const handleReset = () => {
    const defaultBg = GRADIENT_BACKGROUNDS[0];
    setSelectedBg(defaultBg);
    onSelectBackground(defaultBg, applyToAll);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Chat Wallpaper and Background Selector"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full sm:max-w-md max-h-[88vh] rounded-t-[28px] sm:rounded-3xl border flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        {/* Top Header */}
        <div className="p-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-500">
              <Palette size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
                Chat Wallpaper
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
                Customizing for {conversationName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
              title="Reset to default theme"
              aria-label="Reset background"
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              aria-label="Close selector"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Preview Bubble Area */}
        <div className="p-3.5 border-b" style={{ borderColor: 'var(--line)' }}>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-2">
            Live Preview
          </p>
          <div
            className="w-full h-28 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-inner relative border"
            style={{
              borderColor: 'var(--line)',
              background:
                selectedBg.type === 'image'
                  ? `url(${selectedBg.value}) center/cover no-repeat`
                  : selectedBg.value,
            }}
          >
            {/* Subtle darkening overlay for readability */}
            {selectedBg.type === 'image' && (
              <div className="absolute inset-0 bg-black/25 pointer-events-none" />
            )}

            {/* Simulated Received Message */}
            <div className="relative z-10 max-w-[70%] self-start bg-white text-slate-900 rounded-2xl rounded-bl-[4px] px-3 py-1.5 text-xs shadow-xs">
              Hey! Look at this chat background ✨
            </div>

            {/* Simulated Sent Message */}
            <div className="relative z-10 max-w-[70%] self-end bg-[#007AFF] text-white rounded-2xl rounded-br-[4px] px-3 py-1.5 text-xs shadow-xs flex items-center gap-1.5">
              <span>Looks super clean!</span>
              <CheckCheck size={12} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Source Switcher: Unified Segmented Tabs */}
        <div className="px-4 pt-3 pb-2 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('gradients')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'gradients'
                ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
            }`}
          >
            <Sparkles size={14} />
            <span>Gradients ({GRADIENT_BACKGROUNDS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'gallery'
                ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--line)]'
            }`}
          >
            <ImageIcon size={14} />
            <span>Gallery Photos ({GALLERY_BACKGROUNDS.length + (customPhoto ? 1 : 0)})</span>
          </button>
        </div>

        {/* Options Grid Scroll Area */}
        <div className="p-4 overflow-y-auto max-h-[36vh] space-y-3">
          {activeTab === 'gradients' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {GRADIENT_BACKGROUNDS.map((opt) => {
                const isSelected = selectedBg.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBg(opt)}
                    className={`h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left transition-all relative overflow-hidden cursor-pointer group border ${
                      isSelected
                        ? 'ring-2 ring-[#007AFF] border-transparent scale-[0.98]'
                        : 'border-[var(--line)] hover:scale-[1.02]'
                    }`}
                    style={{ background: opt.preview }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white drop-shadow-md">
                        {opt.name}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-[#007AFF] flex items-center justify-center shadow-md">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-3">
              {/* Custom Device Gallery Upload Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[var(--line-strong)] hover:border-[#007AFF] bg-[var(--surface-sunken)] hover:bg-[#007AFF]/5 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text)] transition-colors cursor-pointer"
                >
                  <Upload size={15} className="text-[#007AFF]" />
                  <span>{isUploading ? 'Compressing photo...' : 'Choose Photo from Your Device Gallery 📸'}</span>
                </button>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Custom Uploaded Photo Card if available */}
                {customPhoto && (
                  <button
                    type="button"
                    onClick={() => setSelectedBg(customPhoto)}
                    className={`h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left transition-all relative overflow-hidden cursor-pointer group border ${
                      selectedBg.id === customPhoto.id
                        ? 'ring-2 ring-[#007AFF] border-transparent scale-[0.98]'
                        : 'border-[var(--line)] hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundImage: `url(${customPhoto.value})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-white drop-shadow-md">
                        Custom Photo
                      </span>
                      {selectedBg.id === customPhoto.id && (
                        <div className="w-5 h-5 rounded-full bg-white text-[#007AFF] flex items-center justify-center shadow-md">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {/* Curated Gallery Photos */}
                {GALLERY_BACKGROUNDS.map((opt) => {
                  const isSelected = selectedBg.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedBg(opt)}
                      className={`h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left transition-all relative overflow-hidden cursor-pointer group border ${
                        isSelected
                          ? 'ring-2 ring-[#007AFF] border-transparent scale-[0.98]'
                          : 'border-[var(--line)] hover:scale-[1.02]'
                      }`}
                      style={{
                        backgroundImage: `url(${opt.preview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors pointer-events-none" />
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-white drop-shadow-md">
                          {opt.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-[#007AFF] flex items-center justify-center shadow-md">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <div
          className="p-3.5 border-t space-y-2.5 bg-[var(--surface)]"
          style={{
            borderColor: 'var(--line)',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          }}
        >
          {/* Apply to all chats checkbox */}
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded text-[#007AFF] accent-[#007AFF]"
            />
            <span>Set as default background for all chats</span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl text-xs font-bold border border-[var(--line)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
              style={{ color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 h-11 rounded-xl text-xs font-bold bg-[#007AFF] text-white hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check size={15} />
              <span>Apply Wallpaper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBackgroundSelector;
