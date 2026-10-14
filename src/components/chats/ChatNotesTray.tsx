'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Music, Play, Pause, X, Send, Disc3, Sparkles } from 'lucide-react';
import { DataStore, ChatNote, SongTrack, Profile, DUMMY_TEST_USERNAMES } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { MIXED_NOTE_COLORS, getNoteColorTheme } from '@/config/noteThemes';
import { globalAudio, AudioPlayerState } from '@/lib/audioManager';
import { MusicTrackPill } from '@/components/music/MusicTrackPill';
import { SongPickerModal } from '@/components/music/SongPickerModal';

interface ChatNotesTrayProps {
  onReplyToNote?: (note: ChatNote, replyText?: string) => void;
}

export const ChatNotesTray: React.FC<ChatNotesTrayProps> = ({ onReplyToNote }) => {
  const [notes, setNotes] = useState<ChatNote[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('sunset');
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);
  const [activeNoteAction, setActiveNoteAction] = useState<ChatNote | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const loadData = () => {
    setCurrentUser(DataStore.getCurrentUser());
    setNotes(DataStore.getChatNotes());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dpsbuzz:content_updated', loadData);
    window.addEventListener('storage', loadData);

    const unsub = globalAudio.subscribe((state) => {
      setPlayerState(state);
    });

    const syncInterval = setInterval(() => {
      DataStore.syncWithServer().then(() => loadData());
    }, 4000);

    return () => {
      window.removeEventListener('dpsbuzz:content_updated', loadData);
      window.removeEventListener('storage', loadData);
      clearInterval(syncInterval);
      unsub();
    };
  }, []);

  const myNote = notes.find(
    (n) => n.username.toLowerCase() === currentUser?.username.toLowerCase()
  );

  // Strict filter: remove all fake, dummy, or test accounts
  const peerNotes = notes.filter((n) => {
    if (!n || !n.username) return false;
    const clean = n.username.toLowerCase().trim();
    if (clean === currentUser?.username?.toLowerCase().trim()) return false;
    if (DUMMY_TEST_USERNAMES.has(clean)) return false;
    if (clean.includes('test') || clean.includes('fake') || clean.includes('dummy') || clean === 'admin') return false;
    return true;
  });

  const handleOpenMyNoteModal = () => {
    if (myNote) {
      setNoteText(myNote.text);
      setSelectedSong(myNote.song || null);
      setSelectedColorTheme(myNote.colorTheme || 'sunset');
    } else {
      setNoteText('');
      setSelectedSong(null);
      setSelectedColorTheme('sunset');
    }
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedSong) return;

    DataStore.saveChatNote({
      text: noteText.trim() || (selectedSong ? `Listening to ${selectedSong.title} 🎵` : ''),
      song: selectedSong || undefined,
      colorTheme: selectedColorTheme,
    });

    setIsNoteModalOpen(false);
    loadData();
    showToast('Note updated with mixed colors! 🎨');
  };

  const handleDeleteMyNote = () => {
    if (currentUser?.username) {
      DataStore.deleteChatNote(currentUser.username);
      setIsNoteModalOpen(false);
      loadData();
      showToast('Note deleted');
    }
  };

  // Clicking the note: immediately starts playing attached song & opens the reply modal
  const handleTapPeerNote = (note: ChatNote) => {
    if (note.song) {
      globalAudio.playTrack(note.song);
    }
    setActiveNoteAction(note);
    setReplyInputText('');
  };

  // Toggling song playback specifically via the Play button
  const handleToggleSong = (e: React.MouseEvent, song: SongTrack) => {
    e.stopPropagation();
    globalAudio.toggleTrack(song);
  };

  // Sending reply (via emoji or typed text)
  const handleSendReply = (note: ChatNote, textToSend: string) => {
    if (!textToSend.trim()) return;
    const trimmed = textToSend.trim();

    if (onReplyToNote) {
      onReplyToNote(note, trimmed);
    } else {
      // Fallback: save to localStorage chat messages
      try {
        const myUsername = (currentUser?.username || 'me').toLowerCase().trim();
        const convId = [myUsername, note.username.toLowerCase().trim()].sort().join('__');
        const saved = localStorage.getItem('dpsbuzz_chat_messages_v1');
        const map = saved ? JSON.parse(saved) : {};

        const formatted = note.song
          ? `🎵 Replying to note "${note.text}" (${note.song.title} - ${note.song.artist}): ${trimmed}`
          : `💭 Replying to note "${note.text}": ${trimmed}`;

        const newMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: formatted,
          sender: 'me',
          senderUsername: myUsername,
          time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date()),
        };

        map[convId] = [...(map[convId] || []), newMsg];
        localStorage.setItem('dpsbuzz_chat_messages_v1', JSON.stringify(map));

        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            recipientUsername: note.username,
            message: newMsg,
          }),
        }).catch(() => {});
      } catch {}
    }

    setActiveNoteAction(null);
    setReplyInputText('');
    showToast(`Replied to @${note.username} in chat! 💬`);
  };

  const isMySongPlaying =
    !!myNote?.song &&
    playerState.currentTrack?.id === myNote.song?.id &&
    playerState.isPlaying;

  const quickReactionEmojis = ['❤️', '🔥', '😂', '👏', '😮', '🙌', '🎵', '💯'];

  return (
    <div className="pt-2 pb-3 border-b border-[var(--line)] bg-[var(--surface)] relative">
      {/* Horizontal Tray of Notes - pt-9 ensures -top-8 thought bubbles are never clipped */}
      <div className="flex items-start gap-5 overflow-x-auto no-scrollbar px-4 pt-9 pb-2">
        {/* Current User Note / Add Note */}
        {(() => {
          const myTheme = getNoteColorTheme(myNote?.colorTheme, currentUser?.username);
          return (
            <div className="flex flex-col items-center flex-shrink-0 group">
              <div className="relative mb-1">
                {/* Thought Bubble with Modern Crisp Typography & Mixed Colors */}
                <button
                  type="button"
                  onClick={handleOpenMyNoteModal}
                  className="btn-apple absolute -top-8 left-1/2 -translate-x-1/2 z-10 max-w-[125px] px-3 py-1.5 rounded-2xl text-[11px] sm:text-[12px] text-white font-sans font-bold tracking-tight shadow-xl flex items-center gap-1.5 truncate transition-all cursor-pointer hover:scale-105"
                  style={{
                    background: myNote ? myTheme.gradient : 'rgba(24, 24, 27, 0.95)',
                    border: myNote ? `1px solid ${myTheme.border}` : '1px dashed rgba(255, 255, 255, 0.25)',
                    boxShadow: myNote ? myTheme.bubbleShadow : 'none',
                    color: '#FFFFFF',
                  }}
                >
                  {myNote ? (
                    <>
                      {myNote.song && <span className="text-white drop-shadow-xs">🎵</span>}
                      <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{myNote.text}</span>
                    </>
                  ) : (
                    <span className="text-zinc-400 font-bold">+ Note</span>
                  )}
                  {/* Pointer triangle */}
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{
                      background: myNote ? myTheme.accent : 'rgba(24, 24, 27, 0.95)',
                      borderRight: myNote ? `1px solid ${myTheme.border}` : '1px solid rgba(255, 255, 255, 0.25)',
                      borderBottom: myNote ? `1px solid ${myTheme.border}` : '1px solid rgba(255, 255, 255, 0.25)',
                    }}
                  />
                </button>

                {/* Big 80px Profile Avatar */}
                <div
                  onClick={handleOpenMyNoteModal}
                  className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-lg mt-3 relative transition-transform group-hover:scale-102 p-1 ${
                    myNote
                      ? 'ring-2'
                      : 'border-2 border-zinc-700 hover:border-zinc-500 bg-zinc-800'
                  }`}
                  style={
                    myNote
                      ? {
                          background: myTheme.gradient,
                          boxShadow: `0 0 14px ${myTheme.glow}`,
                        }
                      : undefined
                  }
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-black text-white">
                        {currentUser?.fullName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {!myNote && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full gradient-bg text-white flex items-center justify-center text-xs shadow-md">
                      <Plus size={13} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* Scrolling Song Name & Singer Name Marquee Ticker with Play Button */}
              {myNote?.song && (
                <div
                  onClick={handleOpenMyNoteModal}
                  className="w-[96px] h-[23px] overflow-hidden rounded-full px-1.5 flex items-center gap-1 mt-1 shadow-xs cursor-pointer border"
                  style={{
                    background: 'rgba(24, 24, 27, 0.95)',
                    borderColor: myTheme.border,
                    boxShadow: `0 0 8px ${myTheme.glow}`,
                  }}
                  title={`Song: ${myNote.song.title} by ${myNote.song.artist}`}
                >
                  {/* Direct Play/Pause Button on Note */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSong(e, myNote.song!)}
                    className="btn-apple w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform hover:scale-110"
                    style={{ background: myTheme.gradient }}
                    aria-label={isMySongPlaying ? 'Pause song' : 'Play song'}
                  >
                    {isMySongPlaying ? (
                      <Pause size={9} strokeWidth={3} />
                    ) : (
                      <Play size={9} strokeWidth={3} className="ml-0.5" />
                    )}
                  </button>

                  <div className="overflow-hidden flex-1 relative h-full flex items-center">
                    <div className="animate-notes-marquee text-[10px] font-bold text-white">
                      <span>{myNote.song.title} • {myNote.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                      <span>{myNote.song.title} • {myNote.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                    </div>
                  </div>
                </div>
              )}

              <span className="text-[11px] text-[var(--text-muted)] font-bold truncate max-w-[80px] text-center mt-1">
                Your note
              </span>
            </div>
          );
        })()}

        {/* Peer Classmates Notes (Real Students Only) */}
        {peerNotes.map((note) => {
          const colors = getAvatarColorPair(note.username);
          const peerTheme = getNoteColorTheme(note.colorTheme, note.username);
          const isSongAttached = !!note.song;
          const isThisSongPlaying =
            isSongAttached &&
            playerState.currentTrack?.id === note.song?.id &&
            playerState.isPlaying;

          return (
            <div key={note.id} className="flex flex-col items-center flex-shrink-0 group">
              <div className="relative mb-1">
                {/* Thought Bubble with Modern Crisp Typography & Mixed Colors */}
                <button
                  type="button"
                  onClick={() => handleTapPeerNote(note)}
                  className="btn-apple absolute -top-8 left-1/2 -translate-x-1/2 z-10 max-w-[125px] px-3 py-1.5 rounded-2xl border text-[11px] sm:text-[12px] font-sans font-bold tracking-tight shadow-xl flex items-center gap-1.5 truncate transition-all cursor-pointer hover:scale-105"
                  style={{
                    background: peerTheme.gradient,
                    border: `1px solid ${peerTheme.border}`,
                    boxShadow: isThisSongPlaying ? `0 0 16px ${peerTheme.glow}` : peerTheme.bubbleShadow,
                    color: '#FFFFFF',
                  }}
                  title={note.song ? `Playing: ${note.song.title} by ${note.song.artist}` : note.text}
                >
                  {isSongAttached && (
                    <span className={isThisSongPlaying ? 'animate-pulse text-white drop-shadow-xs shrink-0' : 'text-white drop-shadow-xs shrink-0'}>
                      🎵
                    </span>
                  )}
                  <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{note.text}</span>
                  {/* Pointer triangle */}
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{
                      background: peerTheme.accent,
                      borderRight: `1px solid ${peerTheme.border}`,
                      borderBottom: `1px solid ${peerTheme.border}`,
                    }}
                  />
                </button>

                {/* Big 80px Avatar with Glowing/Gradient Mixed Color Ring */}
                <div
                  onClick={() => handleTapPeerNote(note)}
                  className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-lg mt-3 p-1 transition-transform group-hover:scale-102 relative ring-2`}
                  style={{
                    background: peerTheme.gradient,
                    boxShadow: isThisSongPlaying ? `0 0 18px ${peerTheme.glow}` : `0 0 10px ${peerTheme.glow}`,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {note.avatar ? (
                      <img
                        src={note.avatar}
                        alt={note.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-black">
                        {note.fullName?.[0]?.toUpperCase() || note.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Mini floating play indicator on avatar */}
                  {isSongAttached && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleSong(e, note.song!)}
                      className={`btn-apple absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border border-white/40 ${
                        isThisSongPlaying ? 'bg-pink-500 animate-pulse' : 'bg-black/80 hover:bg-pink-600'
                      }`}
                      aria-label="Toggle song preview"
                    >
                      {isThisSongPlaying ? (
                        <Pause size={10} strokeWidth={3} />
                      ) : (
                        <Play size={10} strokeWidth={3} className="ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Scrolling Song Name & Singer Name Marquee Ticker with Play Button */}
              {note.song && (
                <div
                  onClick={() => handleTapPeerNote(note)}
                  className="w-[96px] h-[23px] overflow-hidden rounded-full px-1.5 flex items-center gap-1 mt-1 shadow-xs cursor-pointer border"
                  style={{
                    background: 'rgba(24, 24, 27, 0.95)',
                    borderColor: peerTheme.border,
                    boxShadow: `0 0 8px ${peerTheme.glow}`,
                  }}
                  title={`Song: ${note.song.title} by ${note.song.artist}`}
                >
                  {/* Direct Play/Pause button on pill */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSong(e, note.song!)}
                    className="btn-apple w-4 h-4 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform hover:scale-110"
                    style={{ background: peerTheme.gradient }}
                    aria-label={isThisSongPlaying ? 'Pause song' : 'Play song'}
                  >
                    {isThisSongPlaying ? (
                      <Pause size={9} strokeWidth={3} />
                    ) : (
                      <Play size={9} strokeWidth={3} className="ml-0.5" />
                    )}
                  </button>

                  <div className="overflow-hidden flex-1 relative h-full flex items-center">
                    <div className="animate-notes-marquee text-[10px] font-bold text-white">
                      <span>{note.song.title} • {note.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                      <span>{note.song.title} • {note.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                    </div>
                  </div>
                </div>
              )}

              <span className="text-[11px] text-[var(--text)] font-bold truncate max-w-[80px] text-center mt-1">
                {note.fullName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* NOTE INTERACTION & REPLY SHEET WITH PLAYING SONG + EMOJIS + TEXT     */}
      {/* ==================================================================== */}
      {activeNoteAction && (() => {
        const activeTheme = getNoteColorTheme(activeNoteAction.colorTheme, activeNoteAction.username);
        return (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none"
            onClick={() => setActiveNoteAction(null)}
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Sheet Drag Indicator for Mobile */}
              <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto sm:hidden -mt-1 mb-2" />

              {/* Classmate Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white font-bold p-0.5 shadow-sm"
                    style={{ background: activeTheme.gradient }}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                      {activeNoteAction.avatar ? (
                        <img
                          src={activeNoteAction.avatar}
                          alt={activeNoteAction.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        activeNoteAction.fullName?.[0]?.toUpperCase() || activeNoteAction.username[0].toUpperCase()
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{activeNoteAction.fullName}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">· Class 8-A</span>
                    </h4>
                    <p className="text-[11px] text-zinc-400">@{activeNoteAction.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNoteAction(null)}
                  className="btn-apple p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
                  aria-label="Close note popup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Note text thought bubble in Vibrant Mixed Colors */}
              <div
                className="relative p-3.5 rounded-2xl text-xs font-semibold text-white leading-relaxed shadow-lg border"
                style={{
                  background: activeTheme.gradient,
                  border: `1px solid ${activeTheme.border}`,
                  boxShadow: activeTheme.bubbleShadow,
                }}
              >
                <span className="text-white/80 text-sm font-serif mr-1">&ldquo;</span>
                <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{activeNoteAction.text}</span>
                <span className="text-white/80 text-sm font-serif ml-1">&rdquo;</span>
              </div>

            {/* Attached Song with Continuous Marquee & Live Player */}
            {activeNoteAction.song && (
              <div className="p-3 rounded-2xl bg-zinc-900/90 border border-pink-500/40 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Disc3 size={12} className={playerState.isPlaying && playerState.currentTrack?.id === activeNoteAction.song.id ? 'animate-spin' : ''} />
                    <span>Attached Music</span>
                  </span>
                  <span className="text-zinc-500">30s Preview</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Artwork Image */}
                  <img
                    src={activeNoteAction.song.artworkUrl}
                    alt={activeNoteAction.song.title}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm border border-zinc-700 shrink-0"
                  />

                  {/* Song Title and Singer Scrolling Marquee */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="overflow-hidden relative h-5 flex items-center">
                      <div className="animate-notes-marquee text-xs font-bold text-pink-200">
                        <span>{activeNoteAction.song.title} • {activeNoteAction.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                        <span>{activeNoteAction.song.title} • {activeNoteAction.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      Artist: {activeNoteAction.song.artist}
                    </p>
                  </div>

                  {/* Play / Pause Toggle Button */}
                  <button
                    type="button"
                    onClick={() => globalAudio.toggleTrack(activeNoteAction.song!)}
                    className="btn-apple w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md hover:opacity-90 transition-opacity"
                    aria-label={
                      playerState.isPlaying && playerState.currentTrack?.id === activeNoteAction.song.id
                        ? 'Pause song'
                        : 'Play song'
                    }
                  >
                    {playerState.isPlaying && playerState.currentTrack?.id === activeNoteAction.song.id ? (
                      <Pause size={16} strokeWidth={2.5} />
                    ) : (
                      <Play size={16} strokeWidth={2.5} className="ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                {playerState.currentTrack?.id === activeNoteAction.song.id && (
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-pink-500 transition-all duration-200"
                      style={{ width: `${playerState.progress * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quick Emoji Reaction Buttons (Tap to send instant reply in chat) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Quick Emoji Reaction:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {quickReactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReply(activeNoteAction, emoji)}
                    className="btn-apple py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 text-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    title={`Send ${emoji} in chat`}
                  >
                    <span>{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type a Custom Reply Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply(activeNoteAction, replyInputText);
              }}
              className="space-y-2 pt-1 border-t border-zinc-900"
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Reply to Note in Chat:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyInputText}
                  onChange={(e) => setReplyInputText(e.target.value)}
                  placeholder={`Reply to @${activeNoteAction.username}...`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!replyInputText.trim()}
                  className="btn-apple h-9 px-4 rounded-full gradient-bg text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <Send size={13} />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* Create / Edit Note Modal */}
      {isNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Share a Note & Song 💭</h3>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="btn-apple p-1 text-zinc-400 hover:text-white"
                aria-label="Close note modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <p className="text-[11px] text-zinc-400">
                Share a thought and song clip. Your classmates can listen and see it above your avatar for 24 hours.
              </p>

              <div>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="What's on your mind? (e.g. Revision mode 📚)"
                  maxLength={60}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                  autoFocus
                />
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 px-1">
                  <span>Vanishes in 24 hours</span>
                  <span>{noteText.length}/60</span>
                </div>
              </div>

              {/* Music Selection on Note */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Add Song to Note (30s Free) 🎵
                </span>

                {selectedSong ? (
                  <MusicTrackPill
                    song={selectedSong}
                    onRemove={() => setSelectedSong(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSongPickerOpen(true)}
                    className="btn-apple w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-pink-500/60 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-pink-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Music size={14} />
                    <span>Choose Music (Anirudh, Bollywood, Lofi...)</span>
                  </button>
                )}
              </div>

              {/* Mixed Color Gradient Palette Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Note Color (Mixed Gradients) 🎨</span>
                  </span>
                  <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400" />
                    <span>{MIXED_NOTE_COLORS.find((c) => c.id === selectedColorTheme)?.name || 'Sunset Glow'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {MIXED_NOTE_COLORS.map((theme) => {
                    const isSelected = selectedColorTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedColorTheme(theme.id)}
                        className={`h-9 rounded-xl transition-all flex items-center justify-center p-0.5 cursor-pointer relative shadow-sm ${
                          isSelected
                            ? 'ring-2 ring-white scale-105 shadow-md'
                            : 'opacity-75 hover:opacity-100 hover:scale-102'
                        }`}
                        style={{
                          background: theme.gradient,
                          border: `1px solid ${theme.border}`,
                        }}
                        title={theme.name}
                      >
                        {isSelected && (
                          <span className="text-white text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Color Preview Bubble */}
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <div
                    className="px-3 py-1.5 rounded-2xl text-[11px] font-bold text-white shadow-md max-w-[220px] truncate"
                    style={{
                      background:
                        MIXED_NOTE_COLORS.find((c) => c.id === selectedColorTheme)?.gradient ||
                        MIXED_NOTE_COLORS[0].gradient,
                      border: `1px solid ${
                        MIXED_NOTE_COLORS.find((c) => c.id === selectedColorTheme)?.border ||
                        MIXED_NOTE_COLORS[0].border
                      }`,
                      boxShadow:
                        MIXED_NOTE_COLORS.find((c) => c.id === selectedColorTheme)?.bubbleShadow,
                    }}
                  >
                    {noteText.trim() ? noteText : 'Live Preview: Mixed Color Bubble ✨'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                {myNote && (
                  <button
                    type="button"
                    onClick={handleDeleteMyNote}
                    className="btn-apple px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="btn-apple flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-semibold border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!noteText.trim() && !selectedSong}
                  className="btn-apple flex-1 py-2.5 rounded-xl gradient-bg text-white text-xs font-bold disabled:opacity-40 shadow-md cursor-pointer"
                >
                  Share Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Song Picker Modal for Note */}
      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        title="Add Music to Note 🎵"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white bg-zinc-900 border border-zinc-700 shadow-xl animate-fade-in pointer-events-none select-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
export default ChatNotesTray;
