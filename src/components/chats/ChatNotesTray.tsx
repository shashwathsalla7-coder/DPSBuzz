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
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('classic');
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
    }, 10000);

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
      setSelectedColorTheme(myNote.colorTheme || 'classic');
    } else {
      setNoteText('');
      setSelectedSong(null);
      setSelectedColorTheme('classic');
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
        const myUsername = (currentUser?.username || '').toLowerCase().trim();
        if (myUsername && myUsername !== 'guest') {
          const convId = [myUsername, note.username.toLowerCase().trim()].sort().join('__');
          const userMsgKey = `dpsbuzz_chat_messages_${myUsername}_v3`;
          const saved = localStorage.getItem(userMsgKey);
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
          localStorage.setItem(userMsgKey, JSON.stringify(map));

          fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: convId,
              senderUsername: myUsername,
              recipientUsername: note.username,
              message: newMsg,
            }),
          }).catch(() => {});
        }
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
      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar px-4 pt-9 pb-2">
        {/* Current User Note / Add Note */}
        {(() => {
          const myTheme = getNoteColorTheme(myNote?.colorTheme, currentUser?.username);
          return (
            <div className="flex flex-col items-center flex-shrink-0 group">
              <div className="relative mb-1">
                {/* Thought Bubble with Modern Crisp Typography & Authentic Double Thought Dots */}
                <button
                  type="button"
                  onClick={handleOpenMyNoteModal}
                  className="btn-apple absolute -top-8 left-1/2 -translate-x-1/2 z-10 max-w-[125px] px-3 py-1.5 rounded-[18px] text-[11px] sm:text-[12px] text-white font-sans font-bold tracking-tight shadow-xl flex items-center gap-1.5 truncate transition-all cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    background: myNote ? myTheme.gradient : 'rgba(38, 38, 38, 0.95)',
                    border: myNote ? `1px solid ${myTheme.border}` : '1px dashed rgba(255, 255, 255, 0.25)',
                    boxShadow: myNote ? myTheme.bubbleShadow : 'none',
                    color: '#FFFFFF',
                  }}
                >
                  {myNote ? (
                    <>
                      {myNote.song && <span className="text-white drop-shadow-xs shrink-0">🎵</span>}
                      <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] uppercase">{myNote.text}</span>
                    </>
                  ) : (
                    <span className="text-zinc-300 font-bold">+ Note</span>
                  )}
                  {/* Authentic Instagram Double Thought Dots Tail */}
                  <span
                    className="absolute -bottom-1.5 left-4 w-2 h-2 rounded-full border border-white/20 pointer-events-none"
                    style={{ background: myNote ? myTheme.accent : '#262626' }}
                  />
                  <span
                    className="absolute -bottom-3 left-2.5 w-1.5 h-1.5 rounded-full border border-white/20 pointer-events-none"
                    style={{ background: myNote ? myTheme.accent : '#262626' }}
                  />
                </button>

                {/* Neatly Proportioned 64px Profile Avatar (Perfect on Laptop & Mobile) */}
                <div
                  onClick={handleOpenMyNoteModal}
                  className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-md mt-3 relative transition-transform group-hover:scale-102 p-0.5 ${
                    myNote
                      ? 'ring-2'
                      : 'border-2 border-zinc-700 hover:border-zinc-500 bg-zinc-800'
                  }`}
                  style={
                    myNote
                      ? {
                          background: myTheme.gradient,
                          boxShadow: `0 0 12px ${myTheme.glow}`,
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
                      <span className="text-lg font-black text-white">
                        {currentUser?.fullName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {!myNote && (
                    <div className="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 rounded-full gradient-bg text-white flex items-center justify-center text-xs shadow-md">
                      <Plus size={11} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* Scrolling Song Name & Singer Name Marquee Ticker with Play Button */}
              {myNote?.song && (
                <div
                  onClick={handleOpenMyNoteModal}
                  className="w-[90px] h-[22px] overflow-hidden rounded-full px-1.5 flex items-center gap-1 mt-1 shadow-xs cursor-pointer border"
                  style={{
                    background: 'rgba(24, 24, 27, 0.95)',
                    borderColor: myTheme.border,
                    boxShadow: `0 0 8px ${myTheme.glow}`,
                  }}
                  title={`Song: ${myNote.song.title} by ${myNote.song.artist}`}
                >
                  <button
                    type="button"
                    onClick={(e) => handleToggleSong(e, myNote.song!)}
                    className="btn-apple w-3.5 h-3.5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform hover:scale-110"
                    style={{ background: myTheme.gradient }}
                    aria-label={isMySongPlaying ? 'Pause song' : 'Play song'}
                  >
                    {isMySongPlaying ? (
                      <Pause size={8} strokeWidth={3} />
                    ) : (
                      <Play size={8} strokeWidth={3} className="ml-0.5" />
                    )}
                  </button>

                  <div className="overflow-hidden flex-1 relative h-full flex items-center">
                    <div className="animate-notes-marquee text-[9.5px] font-bold text-white">
                      <span>{myNote.song.title} • {myNote.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                      <span>{myNote.song.title} • {myNote.song.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                    </div>
                  </div>
                </div>
              )}

              <span className="text-[10.5px] text-[var(--text-muted)] font-semibold truncate max-w-[76px] text-center mt-1">
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
                {/* Thought Bubble with Modern Crisp Typography & Authentic Double Thought Dots */}
                <button
                  type="button"
                  onClick={() => handleTapPeerNote(note)}
                  className="btn-apple absolute -top-8 left-1/2 -translate-x-1/2 z-10 max-w-[125px] px-3 py-1.5 rounded-[18px] border text-[11px] sm:text-[12px] font-sans font-bold tracking-tight shadow-xl flex items-center gap-1.5 truncate transition-all cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    background: peerTheme.gradient,
                    border: `1px solid ${peerTheme.border}`,
                    boxShadow: isThisSongPlaying ? `0 0 16px ${peerTheme.glow}` : peerTheme.bubbleShadow,
                    color: '#FFFFFF',
                  }}
                  title={note.song ? `Playing: ${note.song.title} by ${note.song.artist}` : note.text}
                >
                  {isSongAttached && (
                    <span className="text-white drop-shadow-xs shrink-0">
                      🎵
                    </span>
                  )}
                  <span className="truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] uppercase">{note.text}</span>
                  {/* Authentic Instagram Double Thought Dots Tail */}
                  <span
                    className="absolute -bottom-1.5 left-4 w-2 h-2 rounded-full border border-white/20 pointer-events-none"
                    style={{ background: peerTheme.accent }}
                  />
                  <span
                    className="absolute -bottom-3 left-2.5 w-1.5 h-1.5 rounded-full border border-white/20 pointer-events-none"
                    style={{ background: peerTheme.accent }}
                  />
                </button>

                {/* Neatly Proportioned 64px Avatar (Fits Cleanly on Laptop) */}
                <div
                  onClick={() => handleTapPeerNote(note)}
                  className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-md mt-3 p-0.5 transition-transform group-hover:scale-102 relative ring-2"
                  style={{
                    background: peerTheme.gradient,
                    boxShadow: isThisSongPlaying ? `0 0 16px ${peerTheme.glow}` : `0 0 8px ${peerTheme.glow}`,
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
                      <span className="text-lg font-black">
                        {note.fullName?.[0]?.toUpperCase() || note.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Mini floating play indicator on avatar */}
                  {isSongAttached && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleSong(e, note.song!)}
                      className={`btn-apple absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md border border-white/40 ${
                        isThisSongPlaying ? 'bg-pink-500 animate-pulse' : 'bg-black/80 hover:bg-pink-600'
                      }`}
                      aria-label="Toggle song preview"
                    >
                      {isThisSongPlaying ? (
                        <Pause size={8} strokeWidth={3} />
                      ) : (
                        <Play size={8} strokeWidth={3} className="ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Scrolling Song Marquee */}
              {isSongAttached && (
                <div
                  onClick={() => handleTapPeerNote(note)}
                  className="w-[90px] h-[22px] overflow-hidden rounded-full px-1.5 flex items-center gap-1 mt-1 shadow-xs cursor-pointer border"
                  style={{
                    background: 'rgba(24, 24, 27, 0.95)',
                    borderColor: peerTheme.border,
                    boxShadow: `0 0 8px ${peerTheme.glow}`,
                  }}
                  title={`Song: ${note.song!.title} by ${note.song!.artist}`}
                >
                  <div className="overflow-hidden flex-1 relative h-full flex items-center">
                    <div className="animate-notes-marquee text-[9.5px] font-bold text-white">
                      <span>{note.song!.title} • {note.song!.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                      <span>{note.song!.title} • {note.song!.artist} &nbsp;&nbsp;&nbsp;&nbsp; 🎵 &nbsp;</span>
                    </div>
                  </div>
                </div>
              )}

              <span className="text-[10.5px] text-[var(--text)] font-semibold truncate max-w-[76px] text-center mt-1">
                {note.fullName?.split(' ')[0] || note.username}
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none"
            onClick={() => setActiveNoteAction(null)}
          >
            <div
              className="w-full max-w-[390px] bg-[#121417] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Classmate Info + Close */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold p-0.5 shadow-sm"
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
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white">
                      {activeNoteAction.fullName}
                    </h4>
                    <p className="text-[10px] text-zinc-400">@{activeNoteAction.username}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveNoteAction(null)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Close note popup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Center Stage: Note Bubble with Authentic Double Tail Dots Over Avatar */}
              <div className="flex flex-col items-center py-2">
                <div className="relative mb-3 w-full flex justify-center">
                  <div
                    className="relative max-w-[270px] px-4 py-3 rounded-[24px] text-center font-bold text-white text-[15px] shadow-xl"
                    style={{
                      background: activeTheme.gradient,
                      border: `1px solid ${activeTheme.border}`,
                      boxShadow: activeTheme.bubbleShadow,
                    }}
                  >
                    <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] uppercase tracking-wide">
                      {activeNoteAction.text}
                    </span>
                    {/* Tail Dot 1 (medium) */}
                    <span
                      className="absolute -bottom-2.5 left-7 w-3 h-3 rounded-full border border-white/15"
                      style={{ background: activeTheme.accent || '#262626' }}
                    />
                    {/* Tail Dot 2 (small) */}
                    <span
                      className="absolute -bottom-4.5 left-5 w-1.5 h-1.5 rounded-full border border-white/15"
                      style={{ background: activeTheme.accent || '#262626' }}
                    />
                  </div>
                </div>

                {/* Classmate Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-900 flex items-center justify-center mt-2">
                  {activeNoteAction.avatar ? (
                    <img
                      src={activeNoteAction.avatar}
                      alt={activeNoteAction.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-white">
                      {activeNoteAction.fullName?.[0]?.toUpperCase() || activeNoteAction.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
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
                    <img
                      src={activeNoteAction.song.artworkUrl}
                      alt={activeNoteAction.song.title}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm border border-zinc-700 shrink-0"
                    />

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

                    <button
                      type="button"
                      onClick={() => globalAudio.toggleTrack(activeNoteAction.song!)}
                      className="btn-apple w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                      aria-label={
                        playerState.isPlaying && playerState.currentTrack?.id === activeNoteAction.song.id
                          ? 'Pause song'
                          : 'Play song'
                      }
                    >
                      {playerState.isPlaying && playerState.currentTrack?.id === activeNoteAction.song.id ? (
                        <Pause size={14} strokeWidth={2.5} />
                      ) : (
                        <Play size={14} strokeWidth={2.5} className="ml-0.5" />
                      )}
                    </button>
                  </div>

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

              {/* Quick Emoji Reaction Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block text-left">
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
                className="space-y-2 pt-1 border-t border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInputText}
                    onChange={(e) => setReplyInputText(e.target.value)}
                    placeholder={`Reply to @${activeNoteAction.username}...`}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!replyInputText.trim()}
                    className="btn-apple h-8.5 px-3.5 rounded-full gradient-bg text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    <Send size={12} />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* CREATE / EDIT NOTE MODAL — EXACT INSTAGRAM DESIGN (CENTERED AVATAR)  */}
      {/* ==================================================================== */}
      {isNoteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-[390px] bg-[#121417] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Cancel & Share (Top Bar) */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {myNote ? 'Edit note' : 'New note'}
              </h3>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!noteText.trim() && !selectedSong}
                className="btn-apple px-4 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#006ee6] active:scale-95 text-white text-xs font-bold shadow-md disabled:opacity-40 transition-all cursor-pointer"
              >
                Share
              </button>
            </div>

            {/* CENTER STAGE: Note Thought Bubble Floating Above Avatar (Matching User Screenshot) */}
            <div className="w-full flex flex-col items-center my-2">
              {/* Floating Thought Bubble */}
              <div className="relative mb-3 w-full flex justify-center">
                {(() => {
                  const currentTheme = getNoteColorTheme(selectedColorTheme, currentUser?.username);
                  return (
                    <div
                      className="relative w-full max-w-[270px] px-4 py-3.5 rounded-[24px] shadow-2xl text-center transition-all"
                      style={{
                        background: currentTheme.gradient,
                        border: `1px solid ${currentTheme.border}`,
                        boxShadow: currentTheme.bubbleShadow,
                      }}
                    >
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Share a thought..."
                        maxLength={60}
                        rows={2}
                        autoFocus
                        className="w-full bg-transparent text-center text-[15px] sm:text-[16px] font-bold text-white placeholder-zinc-400 outline-none resize-none leading-snug tracking-wide uppercase select-text"
                      />

                      {/* Tail Dot 1 (medium) */}
                      <span
                        className="absolute -bottom-2.5 left-7 w-3 h-3 rounded-full border border-white/15"
                        style={{ background: currentTheme.accent || '#262626' }}
                      />
                      {/* Tail Dot 2 (small) */}
                      <span
                        className="absolute -bottom-4.5 left-5 w-1.5 h-1.5 rounded-full border border-white/15"
                        style={{ background: currentTheme.accent || '#262626' }}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* The User Avatar in Center */}
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-900 flex items-center justify-center mt-2 relative">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {currentUser?.fullName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Music Selection Pill — Directly Below Avatar (Matching User Prompt) */}
              <div className="mt-4 flex flex-col items-center">
                {selectedSong ? (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-800/90 border border-pink-500/40 shadow-lg animate-scale-in">
                    <img
                      src={selectedSong.artworkUrl}
                      alt={selectedSong.title}
                      className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div className="text-left min-w-0 max-w-[130px]">
                      <p className="text-[11px] font-bold text-white truncate leading-tight">
                        {selectedSong.title}
                      </p>
                      <p className="text-[9.5px] text-zinc-400 truncate leading-tight">
                        {selectedSong.artist}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSongPickerOpen(true)}
                      className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                      title="Choose chorus or main part ✂️"
                    >
                      <span>✂️ Part</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        globalAudio.toggleTrack(selectedSong);
                      }}
                      className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                      aria-label={playerState.isPlaying && playerState.currentTrack?.id === selectedSong.id ? 'Pause' : 'Play'}
                    >
                      {playerState.isPlaying && playerState.currentTrack?.id === selectedSong.id ? (
                        <Pause size={10} strokeWidth={3} />
                      ) : (
                        <Play size={10} strokeWidth={3} className="ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSong(null)}
                      className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                      title="Remove song"
                      aria-label="Remove song"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSongPickerOpen(true)}
                    className="px-4 py-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  >
                    <Music size={14} className="text-pink-400" />
                    <span>Add music 🎵</span>
                  </button>
                )}
              </div>

              {/* Theme Color Selector Dots (Instagram Dark, Sunset, Aurora, etc.) */}
              <div className="w-full mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
                  Color:
                </span>
                {MIXED_NOTE_COLORS.slice(0, 6).map((theme) => {
                  const isSelected = selectedColorTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedColorTheme(theme.id)}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer relative shadow-xs ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{
                        background: theme.gradient,
                        border: `1px solid ${theme.border}`,
                      }}
                      title={theme.name}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Subtitle & Character Counter */}
              <div className="w-full flex items-center justify-between text-[10.5px] text-zinc-500 mt-3 px-1">
                <span>Vanishes in 24 hours</span>
                <span>{noteText.length}/60</span>
              </div>

              {/* Delete Note Button (If Note Already Exists) */}
              {myNote && (
                <button
                  type="button"
                  onClick={handleDeleteMyNote}
                  className="mt-3 text-[11px] text-red-400 hover:text-red-300 font-medium cursor-pointer transition-colors"
                >
                  Delete current note
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Song Picker Modal for Note */}
      <SongPickerModal
        isOpen={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        initialTrack={selectedSong || undefined}
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
