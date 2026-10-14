'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';

// Direction 1 Fonts
type GazetteFont = 'Newsreader' | 'Epilogue' | 'Space Grotesk';
// Direction 2 Fonts
type NotebookFont = 'Shantell Sans' | 'Patrick Hand' | 'Fredoka';

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

function PreviewContent() {
  const [direction, setDirection] = useState<'gazette' | 'notebook'>('gazette');
  const [screen, setScreen] = useState<'home' | 'starboard'>('home');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [gazetteFont, setGazetteFont] = useState<GazetteFont>('Newsreader');
  const [notebookFont, setNotebookFont] = useState<NotebookFont>('Shantell Sans');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-3">
      {/* Import Google Fonts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Epilogue:wght@600;700;800&family=Fredoka:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500;1,6..72,700&family=Patrick+Hand&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Shantell+Sans:ital,wght@0,400..700;1,400..700&family=Space+Grotesk:wght@600;700&display=swap');
      `}} />

      {/* Control Header */}
      <header className="w-full max-w-xl mb-6 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>DPS Buzz Redesign Lab</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Step 1 Preview</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Test Home & Star Board live at 375px mobile viewport</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200 transition font-medium"
            >
              {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
            </button>
          </div>
        </div>

        {/* Direction Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setDirection('gazette')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition border ${
              direction === 'gazette'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Direction 1: Campus Gazette
          </button>
          <button
            onClick={() => setDirection('notebook')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition border ${
              direction === 'notebook'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Direction 2: Rough Notebook
          </button>
        </div>

        {/* Screen & Font Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-700/60">
          {/* Screen Tab */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setScreen('home')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                screen === 'home' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Home Feed
            </button>
            <button
              onClick={() => setScreen('starboard')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                screen === 'starboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Star Board
            </button>
          </div>

          {/* Tested Display Font Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Display Font:</span>
            {direction === 'gazette' ? (
              <select
                value={gazetteFont}
                onChange={(e) => setGazetteFont(e.target.value as GazetteFont)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="Newsreader">Newsreader (Recommended)</option>
                <option value="Epilogue">Epilogue (Assertive Sans)</option>
                <option value="Space Grotesk">Space Grotesk (Original)</option>
              </select>
            ) : (
              <select
                value={notebookFont}
                onChange={(e) => setNotebookFont(e.target.value as NotebookFont)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="Shantell Sans">Shantell Sans (Recommended)</option>
                <option value="Patrick Hand">Patrick Hand (Marker Hand)</option>
                <option value="Fredoka">Fredoka (Original Bold)</option>
              </select>
            )}
          </div>
        </div>
      </header>

      {/* 375px Mobile Frame Viewport */}
      <div className="w-[375px] h-[812px] rounded-[24px] overflow-hidden shadow-2xl border-4 border-slate-700 relative flex flex-col">
        {direction === 'gazette' ? (
          <GazetteScreen
            screen={screen}
            isDark={isDark}
            displayFont={gazetteFont}
            onSwitchScreen={setScreen}
          />
        ) : (
          <NotebookScreen
            screen={screen}
            isDark={isDark}
            displayFont={notebookFont}
            onSwitchScreen={setScreen}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-xs text-slate-500 max-w-sm">
        <p>Testing 375px mobile viewport • Strict zero-houses policy applied</p>
        <p className="mt-1">Open on your phone on local Wi-Fi: <span className="font-mono text-slate-400">http://192.168.29.145:3000/preview</span></p>
      </div>
    </div>
  );
}

/* =========================================================================
 * DIRECTION 1: THE CAMPUS GAZETTE (Scholastic Editorial)
 * ========================================================================= */
function GazetteScreen({
  screen,
  isDark,
  displayFont,
  onSwitchScreen,
}: {
  screen: 'home' | 'starboard';
  isDark: boolean;
  displayFont: GazetteFont;
  onSwitchScreen: (s: 'home' | 'starboard') => void;
}) {
  const bg = isDark ? '#0F172A' : '#F8F7F3';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#1B2A4A';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const navyAnchor = isDark ? '#93C5FD' : '#1B2A4A';
  const brassAccent = isDark ? '#FBBF24' : '#D97706';

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: bg,
        color: textColor,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Masthead */}
      <header
        className="px-4 pt-3 pb-2.5 border-b text-center shrink-0"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderBottomWidth: '1.5px',
        }}
      >
        <div
          className="flex justify-between items-center text-[9px] font-bold tracking-widest uppercase pb-1 mb-1.5 border-b"
          style={{ color: subtextColor, borderColor: borderColor }}
        >
          <span>DILSUKHNAGAR PUBLIC SCHOOL</span>
          <span>TERM 1 • VOL. 24</span>
        </div>
        <div
          className="text-[22px] font-bold tracking-tight leading-none flex items-center justify-center gap-2"
          style={{
            fontFamily: `'${displayFont}', sans-serif`,
            color: navyAnchor,
          }}
        >
          {/* Restrained school logo placeholder */}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-normal border"
            style={{
              backgroundColor: isDark ? '#334155' : '#F1F5F9',
              borderColor: brassAccent,
              color: brassAccent,
            }}
          >
            DPS
          </span>
          <span>DPS BUZZ</span>
        </div>
        <div className="text-[10px] font-medium tracking-wide uppercase mt-1" style={{ color: subtextColor }}>
          The Student Chronicle
        </div>
      </header>

      {/* Screen Body */}
      <div className="flex-1 overflow-y-auto pb-16">
        {screen === 'home' ? (
          <div>
            {/* Story Rings */}
            <div
              className="py-2.5 px-3 flex gap-3 border-b overflow-hidden"
              style={{ borderColor: borderColor }}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center text-xs font-semibold relative"
                  style={{ borderColor: subtextColor, color: subtextColor }}
                >
                  You
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: brassAccent }}
                  >
                    +
                  </div>
                </div>
                <span className="text-[9px] font-medium" style={{ color: subtextColor }}>Your Story</span>
              </div>
              {[
                { name: 'Priya R', class: '10-A' },
                { name: 'Arjun M', class: '9-B' },
                { name: 'Sneha K', class: '10-C' },
                { name: 'Rohan V', class: '8-A' },
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className="w-12 h-12 rounded-full p-[1.5px] border flex items-center justify-center"
                    style={{ borderColor: brassAccent }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ backgroundColor: idx % 2 === 0 ? '#1B2A4A' : '#334155' }}
                    >
                      {s.name.slice(0, 2)}
                    </div>
                  </div>
                  <span className="text-[9px] font-medium" style={{ color: subtextColor }}>{s.name}</span>
                </div>
              ))}
            </div>

            {/* Pinned Dispatch */}
            <div className="p-3">
              <div
                className="p-3 rounded-[6px] border"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  borderLeftWidth: '3.5px',
                  borderLeftColor: brassAccent,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.04)',
                }}
              >
                <div className="text-[9px] font-bold tracking-wider uppercase mb-1" style={{ color: brassAccent }}>
                  Official Dispatch • Assembly Notice
                </div>
                <div
                  className="text-xs font-bold leading-snug mb-1"
                  style={{
                    fontFamily: `'${displayFont}', sans-serif`,
                    color: navyAnchor,
                  }}
                >
                  Morning assembly starts 15 minutes early tomorrow for sports day march-past rehearsal.
                </div>
                <div className="text-[10px]" style={{ color: subtextColor }}>
                  White uniform is compulsory • Posted by Admin Office
                </div>
              </div>
            </div>

            {/* Student Posts */}
            <div className="px-3 space-y-3 pb-3">
              {/* Post 1 */}
              <article
                className="rounded-[6px] border overflow-hidden"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.04)',
                }}
              >
                <div className="p-2.5 flex items-center justify-between border-b" style={{ borderColor: borderColor }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: '#1B2A4A' }}
                    >
                      SR
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none" style={{ color: navyAnchor }}>Sneha Reddy</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>Class 10-C</div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase"
                    style={{ borderColor: borderColor, color: subtextColor }}
                  >
                    Tiffin Break
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs leading-relaxed" style={{ color: textColor }}>
                    Whole senior corridor got locked out during 3rd period because someone misplaced the room key.
                  </p>
                  <div className="mt-2.5 pt-2 border-t flex items-center gap-4 text-[11px] font-medium" style={{ borderColor: borderColor, color: subtextColor }}>
                    <span>44 likes</span>
                    <span>9 comments</span>
                  </div>
                </div>
              </article>

              {/* Post 2 */}
              <article
                className="rounded-[6px] border overflow-hidden"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  boxShadow: '2px 2px 0px rgba(0,0,0,0.04)',
                }}
              >
                <div className="p-2.5 flex items-center justify-between border-b" style={{ borderColor: borderColor }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: '#334155' }}
                    >
                      AM
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none" style={{ color: navyAnchor }}>Arjun Mehta</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>Class 9-A</div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase"
                    style={{ borderColor: borderColor, color: subtextColor }}
                  >
                    Canteen
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs leading-relaxed" style={{ color: textColor }}>
                    Canteen ran out of samosas before 10th standard even got dismissed 😭
                  </p>
                  <div className="mt-2.5 pt-2 border-t flex items-center gap-4 text-[11px] font-medium" style={{ borderColor: borderColor, color: subtextColor }}>
                    <span>31 likes</span>
                    <span>12 comments</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        ) : (
          /* Star Board (Direction 1) */
          <div className="p-3 space-y-3">
            <div
              className="p-3 rounded-[6px] border text-center"
              style={{
                backgroundColor: cardBg,
                borderColor: borderColor,
              }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase mb-1" style={{ color: brassAccent }}>
                Academic & Class Standings
              </div>
              <h2
                className="text-base font-bold"
                style={{
                  fontFamily: `'${displayFont}', sans-serif`,
                  color: navyAnchor,
                }}
              >
                Class Honour Roll
              </h2>
              <p className="text-[10px] mt-1" style={{ color: subtextColor }}>
                Points tallied every Friday after 8th period based on attendance and event merits.
              </p>
            </div>

            {/* Top 3 Class Standings (No houses) */}
            <div
              className="rounded-[6px] border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <div className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider flex justify-between" style={{ borderColor: borderColor, color: subtextColor }}>
                <span>Class Section</span>
                <span>Merit Points</span>
              </div>
              {[
                { rank: '1st', name: 'Class 10-A', points: '340 pts', leader: 'Lead: Science Fair & Quiz' },
                { rank: '2nd', name: 'Class 9-B', points: '295 pts', leader: 'Lead: Debate Semis' },
                { rank: '3rd', name: 'Class 8-C', points: '260 pts', leader: 'Lead: Sports Day March' },
              ].map((c, i) => (
                <div
                  key={i}
                  className="px-3 py-2.5 flex items-center justify-between border-b last:border-b-0"
                  style={{ borderColor: borderColor }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-xs font-bold w-6 h-6 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: i === 0 ? (isDark ? '#78350F' : '#FEF3C7') : isDark ? '#334155' : '#F1F5F9',
                        color: i === 0 ? brassAccent : textColor,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: navyAnchor }}>{c.name}</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>{c.leader}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: brassAccent }}>{c.points}</span>
                </div>
              ))}
            </div>

            {/* Individual Student Merits */}
            <div
              className="rounded-[6px] border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <div className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: borderColor, color: subtextColor }}>
                Top Student Merits This Month
              </div>
              {[
                { name: 'Priya R.', class: 'Class 10-A', reason: 'Inter-school debate win', pts: '+45 pts' },
                { name: 'Arjun M.', class: 'Class 9-B', reason: 'Science lab bulletin setup', pts: '+40 pts' },
                { name: 'Rohan K.', class: 'Class 8-A', reason: 'Library catalogue curation', pts: '+35 pts' },
              ].map((st, i) => (
                <div
                  key={i}
                  className="px-3 py-2 flex items-center justify-between border-b last:border-b-0 text-xs"
                  style={{ borderColor: borderColor }}
                >
                  <div>
                    <span className="font-bold" style={{ color: navyAnchor }}>{st.name}</span>
                    <span className="text-[10px] ml-1.5" style={{ color: subtextColor }}>({st.class})</span>
                    <div className="text-[10px]" style={{ color: subtextColor }}>{st.reason}</div>
                  </div>
                  <span className="font-bold text-xs" style={{ color: brassAccent }}>{st.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <nav
        className="absolute bottom-0 left-0 right-0 h-14 border-t flex items-center justify-around px-2"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderTopWidth: '1.5px',
        }}
      >
        <button
          onClick={() => onSwitchScreen('home')}
          className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: screen === 'home' ? navyAnchor : subtextColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span>Feed</span>
          {screen === 'home' && <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: brassAccent }} />}
        </button>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Notices</span>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span>Post</span>
        </div>

        <button
          onClick={() => onSwitchScreen('starboard')}
          className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: screen === 'starboard' ? navyAnchor : subtextColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Stars</span>
          {screen === 'starboard' && <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: brassAccent }} />}
        </button>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
}

/* =========================================================================
 * DIRECTION 2: ROUGH NOTEBOOK (Indie Sketchbook / Student Zine)
 * RESTRAINED: Clean 1px borders, slight 1–1.5° tilts, light doodle touches.
 * ========================================================================= */
function NotebookScreen({
  screen,
  isDark,
  displayFont,
  onSwitchScreen,
}: {
  screen: 'home' | 'starboard';
  isDark: boolean;
  displayFont: NotebookFont;
  onSwitchScreen: (s: 'home' | 'starboard') => void;
}) {
  const bg = isDark ? '#14151B' : '#F9F8F3';
  const cardBg = isDark ? '#1E202A' : '#FFFFFF';
  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#2E3240' : '#E5E7EB';
  const inkBlue = isDark ? '#93C5FD' : '#1E3A8A';
  const coralMarker = isDark ? '#FB7185' : '#FF5A36';
  const washiColor = isDark ? 'rgba(251, 113, 133, 0.25)' : 'rgba(255, 90, 54, 0.2)';

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: bg,
        backgroundImage: isDark
          ? 'radial-gradient(#2A2D3A 1px, transparent 1px)'
          : 'radial-gradient(#E2E8F0 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        color: textColor,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="px-4 pt-3 pb-2.5 border-b flex items-center justify-between shrink-0"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
        }}
      >
        <div>
          <div className="relative inline-block">
            <span
              className="text-xl font-bold tracking-tight"
              style={{
                fontFamily: `'${displayFont}', cursive`,
                color: inkBlue,
              }}
            >
              DPS Buzz <span className="text-xs font-normal" style={{ color: coralMarker }}>✎</span>
            </span>
            {/* Restrained single hand-drawn marker underline */}
            <div
              className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full"
              style={{ backgroundColor: coralMarker, opacity: 0.8 }}
            />
          </div>
        </div>

        {/* Restrained sticker with slight 1.5 deg tilt */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded border transform rotate-1 inline-block"
          style={{
            backgroundColor: isDark ? '#2E3240' : '#FEF3C7',
            borderColor: isDark ? '#4B5563' : '#FDE68A',
            color: isDark ? '#FDE68A' : '#92400E',
          }}
        >
          Class 6–10 Only
        </span>
      </header>

      {/* Screen Body */}
      <div className="flex-1 overflow-y-auto pb-16">
        {screen === 'home' ? (
          <div>
            {/* Story Bar */}
            <div
              className="py-2.5 px-3 flex gap-3 border-b overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className="w-12 h-12 rounded-xl border border-dashed flex items-center justify-center text-xs font-semibold relative"
                  style={{ borderColor: subtextColor, color: subtextColor }}
                >
                  My Desk
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: coralMarker }}
                  >
                    +
                  </div>
                </div>
                <span className="text-[9px] font-medium" style={{ color: subtextColor }}>You</span>
              </div>
              {[
                { name: 'Rahul S', class: '9-A' },
                { name: 'Tanvi V', class: '8-B' },
                { name: 'Varun K', class: '10-C' },
                { name: 'Ananya G', class: '7-B' },
              ].map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl p-0.5 border flex items-center justify-center"
                    style={{ borderColor: borderColor }}
                  >
                    <div
                      className="w-full h-full rounded-[10px] flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ backgroundColor: idx % 2 === 0 ? '#1E3A8A' : '#0F766E' }}
                    >
                      {s.name.slice(0, 2)}
                    </div>
                  </div>
                  <span className="text-[9px] font-medium" style={{ color: subtextColor }}>{s.name}</span>
                </div>
              ))}
            </div>

            {/* Restrained Washi Tape Notice */}
            <div className="p-3">
              <div
                className="p-3 rounded-lg border relative"
                style={{
                  backgroundColor: isDark ? '#1C2230' : '#FFFBEB',
                  borderColor: isDark ? '#2E3B52' : '#FDE68A',
                }}
              >
                {/* Washi Tape Strip with slight 1 deg tilt */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 border transform -rotate-1"
                  style={{
                    backgroundColor: washiColor,
                    borderColor: 'rgba(0,0,0,0.1)',
                  }}
                />
                <div className="text-[9px] font-bold tracking-wider uppercase mb-1" style={{ color: coralMarker }}>
                  Notice Board • Tiffin Break
                </div>
                <p className="text-xs font-medium leading-snug" style={{ color: textColor }}>
                  Lost: Blue water bottle near the junior badminton court during tiffin break. Please submit to Room 102.
                </p>
              </div>
            </div>

            {/* Student Posts */}
            <div className="px-3 space-y-3 pb-3">
              {/* Post 1 */}
              <article
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div className="p-2.5 flex items-center justify-between border-b" style={{ borderColor: borderColor }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: isDark ? '#2E3240' : '#EFF6FF',
                        color: inkBlue,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      RS
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none" style={{ color: textColor }}>Rahul Sharma</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>Class 9-A</div>
                    </div>
                  </div>
                  {/* Restrained sticker with 1 deg tilt */}
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase transform -rotate-1"
                    style={{
                      backgroundColor: isDark ? '#2E3240' : '#FEF2F2',
                      borderColor: isDark ? '#4B5563' : '#FECACA',
                      color: coralMarker,
                    }}
                  >
                    Free Period
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs leading-relaxed" style={{ color: textColor }}>
                    Maths sir is on leave so we have a free period in the library.
                  </p>
                  <div className="mt-2.5 pt-2 border-t flex items-center gap-4 text-[11px] font-medium" style={{ borderColor: borderColor, color: subtextColor }}>
                    <span>52 cheers</span>
                    <span>7 notes</span>
                  </div>
                </div>
              </article>

              {/* Post 2 */}
              <article
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div className="p-2.5 flex items-center justify-between border-b" style={{ borderColor: borderColor }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: isDark ? '#2E3240' : '#EFF6FF',
                        color: inkBlue,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      TV
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none" style={{ color: textColor }}>Tanvi Verma</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>Class 8-B</div>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase transform rotate-1"
                    style={{
                      backgroundColor: isDark ? '#2E3240' : '#FFFBEB',
                      borderColor: isDark ? '#4B5563' : '#FDE68A',
                      color: isDark ? '#FDE68A' : '#B45309',
                    }}
                  >
                    Tiffin Break
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs leading-relaxed" style={{ color: textColor }}>
                    Canteen ran out of samosas before 10th standard even got dismissed 😭
                  </p>
                  <div className="mt-2.5 pt-2 border-t flex items-center gap-4 text-[11px] font-medium" style={{ borderColor: borderColor, color: subtextColor }}>
                    <span>48 cheers</span>
                    <span>14 notes</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        ) : (
          /* Star Board (Direction 2) */
          <div className="p-3 space-y-3">
            <div
              className="p-3 rounded-lg border text-center"
              style={{
                backgroundColor: cardBg,
                borderColor: borderColor,
              }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase mb-1" style={{ color: coralMarker }}>
                Scoreboard & Merits
              </div>
              <h2
                className="text-base font-bold"
                style={{
                  fontFamily: `'${displayFont}', cursive`,
                  color: inkBlue,
                }}
              >
                Class Tally Board
              </h2>
              <p className="text-[10px] mt-1" style={{ color: subtextColor }}>
                Tally counted every Friday after 8th period.
              </p>
            </div>

            {/* Class Tally Standings */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <div className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider flex justify-between" style={{ borderColor: borderColor, color: subtextColor }}>
                <span>Class Section</span>
                <span>Tally Marks</span>
              </div>
              {[
                { rank: '1', name: 'Class 10-A', pts: '340 pts', tag: 'Top Tally ⭐' },
                { rank: '2', name: 'Class 9-B', pts: '295 pts', tag: 'Chasing' },
                { rank: '3', name: 'Class 8-C', pts: '260 pts', tag: 'Chasing' },
              ].map((c, i) => (
                <div
                  key={i}
                  className="px-3 py-2.5 flex items-center justify-between border-b last:border-b-0"
                  style={{ borderColor: borderColor }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-xs font-bold w-6 h-6 rounded flex items-center justify-center border"
                      style={{
                        backgroundColor: i === 0 ? (isDark ? '#2E3240' : '#FEF3C7') : 'transparent',
                        borderColor: borderColor,
                        color: i === 0 ? coralMarker : textColor,
                      }}
                    >
                      {c.rank}
                    </span>
                    <div>
                      <div className="text-xs font-bold" style={{ color: textColor }}>{c.name}</div>
                      <div className="text-[10px]" style={{ color: subtextColor }}>{c.tag}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: coralMarker }}>{c.pts}</span>
                </div>
              ))}
            </div>

            {/* Merit Notes */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <div className="px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: borderColor, color: subtextColor }}>
                Merit Notes This Month
              </div>
              {[
                { name: 'Priya R.', class: '10-A', note: 'Inter-school debate win', pts: '+45 pts' },
                { name: 'Arjun M.', class: '9-B', note: 'Science exhibition setup', pts: '+40 pts' },
                { name: 'Rohan K.', class: '8-A', note: 'Library bulletin curation', pts: '+35 pts' },
              ].map((m, i) => (
                <div
                  key={i}
                  className="px-3 py-2 flex items-center justify-between border-b last:border-b-0 text-xs"
                  style={{ borderColor: borderColor }}
                >
                  <div>
                    <span className="font-bold" style={{ color: inkBlue }}>{m.name}</span>
                    <span className="text-[10px] ml-1.5" style={{ color: subtextColor }}>({m.class})</span>
                    <div className="text-[10px]" style={{ color: subtextColor }}>{m.note}</div>
                  </div>
                  <span className="font-bold text-xs" style={{ color: coralMarker }}>{m.pts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <nav
        className="absolute bottom-0 left-0 right-0 h-14 border-t flex items-center justify-around px-2"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
        }}
      >
        <button
          onClick={() => onSwitchScreen('home')}
          className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: screen === 'home' ? inkBlue : subtextColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span>Desk</span>
          {screen === 'home' && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: coralMarker }} />}
        </button>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Pinned</span>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span>Post</span>
        </div>

        <button
          onClick={() => onSwitchScreen('starboard')}
          className="flex flex-col items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: screen === 'starboard' ? inkBlue : subtextColor }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Tally</span>
          {screen === 'starboard' && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: coralMarker }} />}
        </button>

        <div className="flex flex-col items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: subtextColor }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Pass</span>
        </div>
      </nav>
    </div>
  );
}
