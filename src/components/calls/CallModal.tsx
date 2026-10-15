'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  SwitchCamera,
  Volume2,
  VolumeX,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { CallSession } from '@/app/api/calls/route';
import { getAvatarColorPair } from '@/config/tokens';

interface CallModalProps {
  call: CallSession;
  isCaller: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerMuted: boolean;
  durationSeconds: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function CallModal({
  call,
  isCaller,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isSpeakerMuted,
  durationSeconds,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onToggleSpeaker,
  onEndCall,
}: CallModalProps) {
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isPipSwapped, setIsPipSwapped] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const otherPersonName = isCaller
    ? call.receiverName || call.receiverUsername
    : call.callerName || call.callerUsername;
  const otherPersonUsername = isCaller ? call.receiverUsername : call.callerUsername;
  const otherPersonAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;
  const colors = getAvatarColorPair(otherPersonUsername || otherPersonName);
  const initials = (otherPersonName || 'User').slice(0, 2).toUpperCase();

  // Monitor remote video tracks to dynamically reveal video once frames arrive
  useEffect(() => {
    if (!remoteStream) {
      setHasRemoteVideo(false);
      return;
    }

    const checkVideoTracks = () => {
      const vTracks = remoteStream.getVideoTracks();
      const hasLiveTrack = vTracks.length > 0 && vTracks.some((t) => t.readyState === 'live');
      setHasRemoteVideo(hasLiveTrack);
    };

    checkVideoTracks();

    const vTracks = remoteStream.getVideoTracks();
    vTracks.forEach((t) => {
      t.addEventListener('unmute', checkVideoTracks);
      t.addEventListener('mute', checkVideoTracks);
      t.addEventListener('ended', checkVideoTracks);
    });

    remoteStream.addEventListener('addtrack', checkVideoTracks);
    remoteStream.addEventListener('removetrack', checkVideoTracks);

    return () => {
      vTracks.forEach((t) => {
        t.removeEventListener('unmute', checkVideoTracks);
        t.removeEventListener('mute', checkVideoTracks);
        t.removeEventListener('ended', checkVideoTracks);
      });
      remoteStream.removeEventListener('addtrack', checkVideoTracks);
      remoteStream.removeEventListener('removetrack', checkVideoTracks);
    };
  }, [remoteStream]);

  // Dedicated Remote Audio Playback: active for both Voice and Video calls
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.muted = isSpeakerMuted;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setNeedsAudioUnlock(false))
          .catch((err) => {
            console.warn('Audio play restricted on mobile:', err);
            setNeedsAudioUnlock(true);
          });
      }
    }
  }, [remoteStream, isSpeakerMuted]);

  // Video Call Main Video Element (Visual only, strictly muted)
  useEffect(() => {
    if (!call.isVideo) return;
    const targetStream = isPipSwapped ? localStream : remoteStream;
    if (mainVideoRef.current && targetStream) {
      if (mainVideoRef.current.srcObject !== targetStream) {
        mainVideoRef.current.srcObject = targetStream;
      }
      mainVideoRef.current.muted = true;
      mainVideoRef.current.play().catch(() => {});
    }
  }, [call.isVideo, localStream, remoteStream, isPipSwapped]);

  // Video Call Floating PIP Video Element (Visual only, strictly muted)
  useEffect(() => {
    if (!call.isVideo) return;
    const pipStream = isPipSwapped ? remoteStream : localStream;
    if (pipVideoRef.current && pipStream) {
      if (pipVideoRef.current.srcObject !== pipStream) {
        pipVideoRef.current.srcObject = pipStream;
      }
      pipVideoRef.current.muted = true;
      pipVideoRef.current.play().catch(() => {});
    }
  }, [call.isVideo, localStream, remoteStream, isPipSwapped]);

  // Global user interaction listener to unlock any blocked audio on mobile browsers
  useEffect(() => {
    const handleUnlock = () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current
          .play()
          .then(() => setNeedsAudioUnlock(false))
          .catch(() => {});
      }
    };

    window.addEventListener('click', handleUnlock, { passive: true });
    window.addEventListener('touchstart', handleUnlock, { passive: true });

    return () => {
      window.removeEventListener('click', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
    };
  }, []);

  const isConnected = call.status === 'connected';

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in text-white overflow-hidden"
      style={{
        backgroundColor: '#0a0a0f',
        backgroundImage:
          'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18), transparent 50%), radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.15), transparent 50%)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${call.isVideo ? 'Video' : 'Voice'} call with ${otherPersonName}`}
    >
      {/* Dedicated Remote Audio Element (Offscreen) - Always active for both Voice and Video calls */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={isSpeakerMuted}
        style={{
          position: 'fixed',
          top: '-200px',
          left: '-200px',
          width: '1px',
          height: '1px',
          opacity: 0.001,
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium">
          <Shield size={13} className="text-emerald-400" />
          <span className="tracking-wide">End-to-End Encrypted</span>
        </div>

        {/* Live Call Duration / Status Pill */}
        <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span>
            {isConnected
              ? formatDuration(durationSeconds)
              : isCaller
              ? 'Ringing...'
              : 'Connecting...'}
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium hidden sm:flex items-center gap-1.5">
          <Sparkles size={13} className="text-yellow-400" />
          <span>{call.isVideo ? 'HD Video' : 'HD Voice'}</span>
        </div>
      </header>

      {/* Autoplay Unlock Pill (shown if mobile browser suspends media) */}
      {needsAudioUnlock && (
        <div className="relative z-30 mx-auto -mt-2 animate-bounce cursor-pointer">
          <div className="px-4 py-1.5 rounded-full bg-amber-500/90 text-black text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Volume2 size={14} />
            <span>Tap anywhere to enable sound</span>
          </div>
        </div>
      )}

      {/* Main Call View Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto min-h-[360px] w-full">
        {call.isVideo ? (
          // VIDEO CALL STAGE
          <div className="relative w-full max-w-2xl h-[58vh] sm:h-[64vh] rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Main Stage Video Element */}
            <video
              ref={mainVideoRef}
              autoPlay
              playsInline
              muted={true}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                (isPipSwapped && !isCameraOff) || (!isPipSwapped && hasRemoteVideo)
                  ? 'opacity-100'
                  : 'opacity-0 absolute pointer-events-none'
              } ${isPipSwapped ? 'transform -scale-x-100' : ''}`}
            />

            {/* Placeholder when remote camera is off or initializing */}
            {((!isPipSwapped && !hasRemoteVideo) || (isPipSwapped && isCameraOff)) && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/20 flex items-center justify-center text-3xl font-bold shadow-xl overflow-hidden"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {otherPersonAvatar ? (
                    <img
                      src={otherPersonAvatar}
                      alt={otherPersonName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-bold">{isPipSwapped ? 'You' : otherPersonName}</h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    {isConnected ? 'Camera is off' : 'Connecting video feed...'}
                  </p>
                </div>
              </div>
            )}

            {/* Floating Picture-in-Picture Preview Window */}
            {(localStream || remoteStream) && (
              <div
                onClick={() => setIsPipSwapped((prev) => !prev)}
                className="absolute bottom-4 right-4 w-28 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl cursor-pointer hover:scale-105 transition-transform bg-zinc-900 group"
                title="Tap to swap view"
              >
                <video
                  ref={pipVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  className={`w-full h-full object-cover ${
                    (!isPipSwapped && !isCameraOff) || (isPipSwapped && hasRemoteVideo)
                      ? 'block'
                      : 'hidden'
                  } ${!isPipSwapped ? 'transform -scale-x-100' : ''}`}
                />

                {((!isPipSwapped && isCameraOff) || (isPipSwapped && !hasRemoteVideo)) && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-neutral-400 p-2 text-center">
                    <VideoOff size={18} />
                    <span className="text-[10px] mt-1 font-semibold">Camera off</span>
                  </div>
                )}

                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white/90">
                  {isPipSwapped ? otherPersonName : 'You'}
                </div>
              </div>
            )}
          </div>
        ) : (
          // VOICE CALL STAGE
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Pulsing Avatar Radar Rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-44 h-44 rounded-full bg-indigo-500/15 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full bg-pink-500/20 animate-pulse" />
              <div
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 flex items-center justify-center text-4xl font-extrabold shadow-2xl overflow-hidden z-10"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {otherPersonAvatar ? (
                  <img
                    src={otherPersonAvatar}
                    alt={otherPersonName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {otherPersonName}
              </h2>
              <p className="text-sm font-semibold text-neutral-400">
                @{otherPersonUsername}
              </p>
              <p className="text-xs font-medium text-emerald-400 pt-1">
                {isConnected ? 'DPS Buzz HD Audio Voice Call' : 'Ringing student device...'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Calling Controls Dock */}
      <footer className="relative z-20 flex flex-col items-center gap-4 pb-2">
        <div className="flex items-center justify-center gap-3 sm:gap-5 px-6 py-3.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Mute Mic Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Toggle Camera Button */}
          <button
            type="button"
            onClick={onToggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isCameraOff
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/30'
            }`}
            aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          {/* Switch Camera (Front/Rear on Mobile) */}
          {call.isVideo && !isCameraOff && (
            <button
              type="button"
              onClick={onSwitchCamera}
              className="w-12 h-12 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Switch camera"
              title="Switch camera"
            >
              <SwitchCamera size={20} />
            </button>
          )}

          {/* Speaker Mute Button */}
          <button
            type="button"
            onClick={onToggleSpeaker}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerMuted
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            title={isSpeakerMuted ? 'Unmute speaker' : 'Speaker'}
          >
            {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Hang Up Button */}
          <button
            type="button"
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-90 transition-transform cursor-pointer ml-1"
            aria-label="End call"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        <p className="text-[11px] text-neutral-400 font-medium">
          Dilsukhnagar Public School • Private Campus Call
        </p>
      </footer>
    </div>
  );
}

export default CallModal;
