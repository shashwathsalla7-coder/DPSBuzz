'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Avatar,
  Chip,
  Card,
  Sheet,
  Toast,
  Tabs,
  EmptyState,
  Skeleton,
  AvatarSkeleton,
  PostCardSkeleton,
} from '@/components/ui';
import { colors, radii, getAvatarColorPair, textStoryPresets } from '@/config/tokens';
import { StoryRing } from '@/components/story/StoryRing';
import { schoolConfig } from '@/config/school';

export default function StyleguidePage() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedChip, setSelectedChip] = useState('All');
  const [selectedDisplayFont, setSelectedDisplayFont] = useState<'cabinet' | 'gambetta' | 'schibsted'>('cabinet');
  const [selectedBodyFont, setSelectedBodyFont] = useState<'satoshi' | 'instrumentsans' | 'ibmmono'>('satoshi');

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };

  const displayFontStyles: Record<string, string> = {
    cabinet: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
    gambetta: "var(--font-gambetta), 'Gambetta', serif",
    schibsted: "'Schibsted Grotesk', sans-serif",
  };

  const bodyFontStyles: Record<string, string> = {
    satoshi: "var(--font-satoshi), 'Satoshi', sans-serif",
    instrumentsans: "'Instrument Sans', sans-serif",
    ibmmono: "var(--font-ibm-mono), 'IBM Plex Mono', monospace",
  };

  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      className="min-h-screen transition-colors duration-200 pb-20 text-[var(--text)] bg-[var(--bg)]"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            ← Home
          </Link>
          <div className="h-4 w-px bg-[var(--line)]" />
          <h1 className="text-sm font-bold font-display uppercase tracking-wider text-[var(--text)]">
            Design Tokens & UI Component System
          </h1>
        </div>

        <button
          onClick={toggleTheme}
          className="text-xs font-semibold px-3 py-1.5 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface-sunken)] text-[var(--text)] cursor-pointer"
        >
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        {/* Section 1: Corner Radii Overrides */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold font-display">
            1. Corner Radius Tokens (Quality Pass Override)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Restrained and friendly. Maximum 12px on any card or container. No pill buttons, no 16–24px card corners.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { token: '--r-xs', val: '4px', target: 'Notice cards, tags' },
              { token: '--r-sm', val: '6px', target: 'Chips, small controls' },
              { token: '--r-md', val: '10px', target: 'Buttons, inputs, post media, groups' },
              { token: '--r-lg', val: '12px', target: 'Cards, profile photo' },
              { token: '--r-bubble', val: '14px', target: 'Chat bubbles' },
              { token: '--r-sheet', val: '16px', target: 'Bottom sheets (top corners)' },
              { token: '--r-full', val: '9999px', target: 'People avatars, story rings' },
            ].map((r) => (
              <div
                key={r.token}
                style={{ borderRadius: r.val }}
                className="p-3 border border-[var(--line)] bg-[var(--surface)] space-y-1 text-left"
              >
                <div className="flex items-center justify-between font-mono font-bold text-xs text-[var(--primary)]">
                  <span>{r.token}</span>
                  <span>{r.val}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">{r.target}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Font Comparison Test Suite */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display">
                2. Font Evaluation: Display & Body Alternatives
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Tested side-by-side with Indian school student copy.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Font Options */}
            <div className="p-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] space-y-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Display Font Slot
              </span>
              <div className="flex gap-2">
                {[
                  { id: 'cabinet', label: 'Cabinet Grotesk (Primary)' },
                  { id: 'gambetta', label: 'Gambetta (Optional Notice)' },
                  { id: 'schibsted', label: 'Schibsted (Google Opt)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedDisplayFont(f.id as any)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] border cursor-pointer ${
                      selectedDisplayFont === f.id
                        ? 'bg-[var(--primary)] text-white border-transparent'
                        : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div
                className="p-4 rounded-[10px] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2"
                style={{ fontFamily: displayFontStyles[selectedDisplayFont] }}
              >
                <p className="text-2xl font-extrabold tracking-[-0.02em] leading-[1.1]">
                  DPS Buzz — Class 10-A Assembly
                </p>
                <p className="text-lg font-bold tracking-[-0.02em] leading-[1.15] text-[var(--primary)]">
                  Star Board Honours: Arjun Reddy (#1)
                </p>
              </div>
            </div>

            {/* Body Font Options */}
            <div className="p-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] space-y-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Body Font Slot
              </span>
              <div className="flex gap-2">
                {[
                  { id: 'satoshi', label: 'Satoshi (Primary)' },
                  { id: 'instrumentsans', label: 'Instrument Sans (Google Opt)' },
                  { id: 'ibmmono', label: 'IBM Plex Mono (Counters)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedBodyFont(f.id as any)}
                    className={`px-2.5 py-1 text-xs rounded-[6px] border cursor-pointer ${
                      selectedBodyFont === f.id
                        ? 'bg-[var(--primary)] text-white border-transparent'
                        : 'bg-[var(--surface-sunken)] border-[var(--line)] text-[var(--text)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div
                className="p-4 rounded-[10px] bg-[var(--surface-sunken)] border border-[var(--line)] space-y-2"
                style={{ fontFamily: bodyFontStyles[selectedBodyFont] }}
              >
                <p className="text-sm leading-relaxed">
                  Whole senior corridor was waiting outside the physics lab during 3rd period because someone misplaced the room key during tiffin break.
                </p>
                <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                  Posted 2h ago · 34 likes · 8 comments
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Shared UI Components Showcase */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display">
            3. Shared UI Components Suite (Built Once & Reused Everywhere)
          </h2>

          <div className="space-y-6">
            {/* Buttons */}
            <Card padding="md" className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Button Component (10px Radius, 44px Tap Target)
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="quiet">Quiet Action</Button>
                <Button variant="destructive">Destructive Action</Button>
                <Button variant="primary" isLoading>Loading State</Button>
              </div>
            </Card>

            {/* Inputs */}
            <Card padding="md" className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Input Component (10px Radius, 48px Height, Focus Ring)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Admission Number"
                  placeholder="DPS-2026-001"
                  helperText="Written on your school diary page 1"
                />
                <Input
                  label="Username"
                  placeholder="arjun_8a"
                  error="Username already claimed by another classmate"
                />
              </div>
            </Card>

            {/* Chips & Tabs */}
            <Card padding="md" className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Chips (6px Radius) & Segmented Tabs (10px Radius)
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                {['All', 'Class 10', 'Class 9', 'Class 8'].map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={selectedChip === c}
                    onClick={() => setSelectedChip(c)}
                  />
                ))}
              </div>

              <div className="max-w-sm pt-2">
                <Tabs
                  items={[
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                    { id: 'alltime', label: 'All Time' },
                  ]}
                  activeId={activeTab}
                  onChange={setActiveTab}
                />
              </div>
            </Card>

            {/* Avatars & Rings */}
            <Card padding="md" className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Avatars: People Circles vs Group Rounded Squares (10px)
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar name="Arjun Reddy" username="arjun_8a" shape="circle" size="md" />
                  <span className="text-[11px] text-[var(--text-muted)]">Person (Circle)</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar name="Class 10-A" shape="square" size="md" />
                  <span className="text-[11px] text-[var(--text-muted)]">Group (Square 10px)</span>
                </div>
              </div>
            </Card>

            {/* Story Rings Quality Pass Specifications */}
            <Card padding="md" className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Story Rings: 62px Outer, 3px Ring, 2px Gap, Dark Glow, Dashed Your Story, Pulse
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Warm orange is permitted ONLY inside story rings and text story backgrounds.
                </p>
              </div>

              <div className="flex items-center gap-6 overflow-x-auto pb-2">
                {/* Your Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <StoryRing variant="your-story" username="arjun_8a" name="You" />
                  <span className="text-[11px] text-[var(--text)] font-medium">Your story (Dashed)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">20px + badge</span>
                </div>

                {/* Unseen Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <StoryRing variant="unseen" username="rohan_8a" name="Rohan V" />
                  <span className="text-[11px] text-[var(--text)] font-medium">Unseen Ring</span>
                  <span className="text-[10px] text-[var(--text-muted)]">62px • 3px grad • glow</span>
                </div>

                {/* New Story Pulse */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <StoryRing variant="unseen" username="priya_8a" name="Priya N" isNew={true} />
                  <span className="text-[11px] text-[var(--text)] font-medium">New Story</span>
                  <span className="text-[10px] text-[var(--text-muted)]">1s pulse (1 &gt; 1.04 &gt; 1)</span>
                </div>

                {/* Seen Story */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <StoryRing variant="seen" username="sneha_10c" name="Sneha P" />
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium">Seen Ring</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Visible Off-White</span>
                </div>
              </div>
            </Card>

            {/* 6 Text Story Background Presets */}
            <Card padding="md" className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Text Story Background Presets (Text at least 28px)
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  6 approved background presets for text stories with required text contrast.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {textStoryPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="h-36 rounded-xl flex flex-col justify-between p-4 shadow-sm"
                    style={{
                      background: preset.background,
                      border: preset.id === 'white' ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        color: '#FFFFFF',
                      }}
                    >
                      {preset.name}
                    </span>
                    <p
                      className="text-[28px] font-extrabold tracking-tight leading-none text-center select-none"
                      style={{
                        color: preset.textColor,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      DPS Buzz 🐝
                    </p>
                    <span
                      className="text-[10px] opacity-75 text-right font-mono"
                      style={{ color: preset.textColor }}
                    >
                      &ge;28px text
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Empty State */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                EmptyState Component (Left-aligned, Notebook Doodle, School Voice)
              </h3>
              <EmptyState
                title="No notices right now."
                description="Check again after morning assembly."
                doodle="bell"
                actionLabel="Refresh feed"
                onAction={() => setShowToast(true)}
              />
            </div>

            {/* Skeletons */}
            <Card padding="md" className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Skeleton Component (1.6s Low Contrast Shimmer)
              </h3>
              <div className="max-w-sm">
                <PostCardSkeleton />
              </div>
            </Card>

            {/* Interactive Sheet & Toast Trigger */}
            <Card padding="md" className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Sheet (16px Top Corners) & Toast (10px Radius)
              </h3>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsSheetOpen(true)}>
                  Open Bottom Sheet
                </Button>
                <Button variant="primary" onClick={() => setShowToast(true)}>
                  Trigger 3-Second Toast
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Sheet Component Demo */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="School Diary Verification"
      >
        <div className="space-y-4 text-xs text-[var(--text)]">
          <p className="leading-relaxed">
            Students are verified directly against the Dilsukhnagar Public School student roster provided by the administrative office.
          </p>
          <div className="p-3 rounded-[10px] bg-[var(--surface-sunken)] border border-[var(--line)]">
            <p className="font-semibold mb-1">Privacy Guarantee</p>
            <p className="text-[var(--text-muted)]">Your admission number is never visible to other students.</p>
          </div>
          <Button fullWidth onClick={() => setIsSheetOpen(false)}>
            Close Sheet
          </Button>
        </div>
      </Sheet>

      {/* Toast Component Demo */}
      <Toast
        message="Notice board refreshed successfully."
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
