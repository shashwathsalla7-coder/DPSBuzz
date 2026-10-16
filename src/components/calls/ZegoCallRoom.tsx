'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZEGO_CONFIG } from '@/config/zego';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { stopCallAudio, playCallConnectedSound, playCallEndedSound, unlockAudioSystem } from '@/lib/callAudio';
import type { CallSession } from '@/app/api/calls/route';

interface ZegoCallRoomProps {
  call: CallSession;
  isCaller: boolean;
  onEndCall: () => void;
  onConnected?: () => void;
}

/**
 * Generate a deterministic room ID so both caller and receiver always enter the identical room
 */
export function getDeterministicRoomId(call: CallSession): string {
  const cleanCallId = (call.callId || '').replace(/[^a-zA-Z0-9_]/g, '_');
  const pairKey = [
    (call.callerUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
    (call.receiverUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
  ]
    .sort()
    .join('_');

  const rawRoomId = cleanCallId.length > 5 ? `dps_${cleanCallId}` : `dps_${pairKey}`;
  return rawRoomId.slice(0, 64);
}

export function ZegoCallRoom({ call, isCaller, onEndCall, onConnected }: ZegoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const zpRef = useRef<any>(null);
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(call.status === 'connected');
  const [isAudioSuspended, setIsAudioSuspended] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const otherPersonName = isCaller
    ? call.receiverName || call.receiverUsername
    : call.callerName || call.callerUsername;
  const otherPersonUsername = isCaller ? call.receiverUsername : call.callerUsername;
  const otherPersonAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;
  const colors = getAvatarColorPair(otherPersonUsername || otherPersonName);
  const initials = (otherPersonName || 'User').slice(0, 2).toUpperCase();

  // If call status changes to connected externally (e.g. from polling or BroadcastChannel), reflect immediately
  useEffect(() => {
    if (call.status === 'connected') {
      setIsRemoteConnected(true);
      stopCallAudio();
      unlockAudioSystem();
    }
  }, [call.status]);

  // Bind remote WebRTC stream directly to native HTML5 audio element for hardware speaker playback
  const bindRemoteMediaStream = useCallback((ZegoClass?: any) => {
    try {
      const core = (ZegoClass || (window as any).ZegoUIKitPrebuilt)?.core;
      const streamMap = core?.remoteStreamMap || {};
      for (const [streamID, stream] of Object.entries(streamMap)) {
        if (stream instanceof MediaStream && remoteAudioRef.current) {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            audioTracks.forEach((t) => {
              t.enabled = true;
            });
            if (remoteAudioRef.current.srcObject !== stream) {
              console.log('[ZEGOCLOUD] Binding remote audio stream to native audio element:', streamID);
              remoteAudioRef.current.srcObject = stream;
              remoteAudioRef.current.muted = false;
              remoteAudioRef.current.volume = 1.0;
              remoteAudioRef.current.play().catch((err) => {
                console.warn('[ZEGOCLOUD] Remote native audio play error:', err);
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ZEGOCLOUD] Error in bindRemoteMediaStream:', err);
    }
  }, []);

  const handleManualUnmute = useCallback(() => {
    unlockAudioSystem();
    bindRemoteMediaStream();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }
    setIsAudioSuspended(false);
  }, [bindRemoteMediaStream]);

  // Periodic health check to guarantee remote audio playback and detect suspended AudioContexts
  useEffect(() => {
    if (!isRemoteConnected) return;

    const interval = setInterval(() => {
      unlockAudioSystem();
      bindRemoteMediaStream();

      let suspended = false;
      const allContexts = (window as any).__dpsbuzz_all_audio_contexts as Set<AudioContext> | undefined;
      allContexts?.forEach((ctx) => {
        if (ctx.state === 'suspended') {
          suspended = true;
          ctx.resume().catch(() => {});
        }
      });

      if (remoteAudioRef.current && remoteAudioRef.current.srcObject && remoteAudioRef.current.paused) {
        suspended = true;
        remoteAudioRef.current.play().catch(() => {});
      }

      setIsAudioSuspended(suspended);
    }, 1200);

    return () => clearInterval(interval);
  }, [isRemoteConnected, bindRemoteMediaStream]);

  useEffect(() => {
    let isMounted = true;

    async function initZego() {
      if (!containerRef.current) return;
      try {
        const mod = await import('@zegocloud/zego-uikit-prebuilt');
        const ZegoUIKitPrebuilt = (mod as any).ZegoUIKitPrebuilt || (mod as any).default?.ZegoUIKitPrebuilt || (mod as any).default;
        if (!isMounted || !containerRef.current || !ZegoUIKitPrebuilt) return;

        const roomID = getDeterministicRoomId(call);

        // Get currently logged-in user details
        const currentUser = DataStore.getCurrentUser();
        const localUsername = (
          currentUser?.username || (isCaller ? call.callerUsername : call.receiverUsername)
        )
          .toLowerCase()
          .trim();
        const cleanUserID = localUsername.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50) || `user_${Date.now()}`;
        const displayName =
          currentUser?.fullName ||
          (isCaller
            ? call.callerName || call.callerUsername
            : call.receiverName || call.receiverUsername);

        console.log('[ZEGOCLOUD] Initializing room:', {
          appID: ZEGO_CONFIG.appID,
          roomID,
          cleanUserID,
          displayName,
          isVideo: call.isVideo,
          isCaller,
        });

        // Generate ZEGOCLOUD kit token for test
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_CONFIG.appID,
          ZEGO_CONFIG.serverSecret,
          roomID,
          cleanUserID,
          displayName || cleanUserID
        );

        // Create clean ZegoUIKit instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        (zp as any).autoLeaveRoomWhenOnlySelfInRoom = false;
        zpRef.current = zp;

        // Connect directly to 1-on-1 Call Room interface
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: Boolean(call.isVideo),
          useFrontFacingCamera: true,
          facingMode: 'user',
          autoLeaveRoomWhenOnlySelfInRoom: false,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showRotatingScreenButton: true,
          videoScreenConfig: {
            objectFit: 'cover',
          },
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          layout: 'Auto',
          showLayoutButton: false,
          showNonVideoUser: true,
          showOnlyAudioUser: true,
          showLeavingView: false,
          showLeaveRoomConfirmDialog: false,
          videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_480P || ZegoUIKitPrebuilt.VideoResolution_720P,
          onUserJoin: (users: any[]) => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Remote participant joined room:', users);
            stopCallAudio();
            playCallConnectedSound();
            setIsRemoteConnected(true);
            onConnectedRef.current?.();

            unlockAudioSystem();
            setTimeout(() => {
              bindRemoteMediaStream(ZegoUIKitPrebuilt);
            }, 300);
          },
          onStreamUpdate: (streamId: string) => {
            console.log('[ZEGOCLOUD] Remote stream arrived/updated:', streamId);
            unlockAudioSystem();
            setTimeout(() => {
              bindRemoteMediaStream(ZegoUIKitPrebuilt);
            }, 200);
          },
          onMicrophoneStateUpdated: (state: "ON" | "OFF") => {
            console.log('[ZEGOCLOUD] Local microphone state:', state);
            setIsMicMuted(state === 'OFF');
          },
          onUserLeave: () => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Remote user left room');
            stopCallAudio();
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
            onEndCallRef.current();
          },
          onLeaveRoom: () => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Local user left room');
            stopCallAudio();
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
            onEndCallRef.current();
          },
        });

        if (isMounted) {
          setIsInitializing(false);
          // Auto-bind streams immediately if already existing
          setTimeout(() => bindRemoteMediaStream(ZegoUIKitPrebuilt), 500);
        }
      } catch (err: any) {
        console.error('[ZEGOCLOUD] Failed to initialize call room:', err);
        if (isMounted) {
          setInitError(err?.message || 'Failed to initialize call room');
          setIsInitializing(false);
        }
      }
    }

    initZego();

    return () => {
      isMounted = false;
      stopCallAudio();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.warn('[ZEGOCLOUD] Error destroying instance:', e);
        }
        zpRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [call.callId, call.isVideo, isCaller]);

  return (
    <div
      className="fixed inset-0 z-[130] w-full h-full min-h-[100dvh] bg-[#0a0a0f] flex flex-col justify-center items-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${call.isVideo ? 'Video' : 'Voice'} call with ${otherPersonName}`}
    >
      {/* 1. Connecting Call Spinner */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0f] text-white space-y-4 select-none">
          <div className="w-14 h-14 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-white">Connecting Call...</h3>
            <p className="text-xs text-neutral-400 font-medium">
              Connecting Ultra-HD call with @{isCaller ? call.receiverUsername : call.callerUsername}
            </p>
          </div>
        </div>
      )}

      {/* 2. Caller Ringing Banner Overlay (shown while waiting for receiver to answer) */}
      {!isInitializing && isCaller && !isRemoteConnected && call.status === 'ringing' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-3 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-2xl animate-fade-in pointer-events-auto select-none">
          <div
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs ring-2 ring-white/20"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {otherPersonAvatar ? (
              <img src={otherPersonAvatar} alt={otherPersonName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-xs font-bold leading-tight truncate">
              Calling {otherPersonName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-[11px] text-emerald-400 font-semibold">Ringing...</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCallAudio();
              onEndCallRef.current();
            }}
            className="ml-2 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-md"
            aria-label="Cancel Call"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3. Connection Error Banner */}
      {initError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <div>
            <h3 className="text-lg font-bold">Connection Failed</h3>
            <p className="text-sm text-neutral-400 mt-1 max-w-sm">{initError}</p>
          </div>
          <button
            onClick={() => {
              stopCallAudio();
              onEndCallRef.current();
            }}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Close Call
          </button>
        </div>
      )}

      {/* 4. Native Hardware Audio Player (Bypasses WebAudio suspensions and iOS silent switch) */}
      <audio
        ref={remoteAudioRef}
        id="dpsbuzz-remote-audio-player"
        autoPlay
        playsInline
        aria-hidden="true"
        className="hidden"
      />

      {/* 5. Full-Screen ZEGOCLOUD Call Container */}
      <div
        ref={containerRef}
        id="zego-call-container"
        data-zego-call="true"
        onTouchStart={handleManualUnmute}
        onClick={handleManualUnmute}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        className="w-full h-full z-0 zego-uikit-prebuilt [&_.zego-uikit-prebuilt]:!h-full [&_.zego-uikit-prebuilt]:!w-full"
      />

      {/* 6. Active Audio Unmute Pill if audio is blocked or suspended */}
      {isRemoteConnected && isAudioSuspended && (
        <button
          type="button"
          onClick={handleManualUnmute}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl animate-bounce cursor-pointer border border-white/20"
          aria-label="Tap to unlock voice"
        >
          <span>🔊</span>
          <span>Tap here to activate voice / unmute</span>
        </button>
      )}

      {/* 7. Microphone Muted Notice */}
      {isRemoteConnected && isMicMuted && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/90 text-white font-semibold text-xs shadow-lg backdrop-blur-md pointer-events-none">
          <span>🎙️</span>
          <span>Your microphone is muted — Tap mic icon below to speak</span>
        </div>
      )}
    </div>
  );
}

export default ZegoCallRoom;
