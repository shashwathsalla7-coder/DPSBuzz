'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZEGO_CONFIG } from '@/config/zego';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import { stopCallAudio, playCallConnectedSound, playCallEndedSound } from '@/lib/callAudio';
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
  const zpRef = useRef<any>(null);
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;
  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(call.status === 'connected');

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
    }
  }, [call.status]);

  useEffect(() => {
    let isMounted = true;
    let timer1: any = null;
    let timer2: any = null;

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

        // Create ZegoUIKit instance with AI Denoise (noise suppression / echo control) enabled
        const zp = ZegoUIKitPrebuilt.create(kitToken, {
          AiDenoiseConfig: { mode: 1 }, // AIBalanced
        });
        (zp as any).autoLeaveRoomWhenOnlySelfInRoom = false;
        zpRef.current = zp;

        // Helper to apply full-duplex AEC, ANS, AGC to audio streams
        const applyAudioEnhancements = (stream?: any) => {
          try {
            const express =
              (zp as any).express ||
              (ZegoUIKitPrebuilt as any).core?.express ||
              (ZegoUIKitPrebuilt as any)._zg;
            if (express) {
              if (typeof express.enableANS === 'function') {
                express.enableANS(true, 1);
              }
              const targetStream = stream || (zp as any).localStream;
              if (targetStream && typeof express.setAudioConfig === 'function') {
                express.setAudioConfig(targetStream, {
                  AEC: true,
                  ANS: true,
                  AGC: true,
                }).catch?.(() => {});
              }
            }

            // Apply native hardware constraints directly to audio tracks for full-duplex echo cancellation
            const targetStream = stream || (zp as any).localStream;
            if (targetStream && typeof targetStream.getAudioTracks === 'function') {
              targetStream.getAudioTracks().forEach((track: any) => {
                try {
                  track.applyConstraints?.({
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                  }).catch?.(() => {});
                } catch {}
              });
            }
          } catch (e) {
            console.warn('[ZEGOCLOUD] Audio enhancements setup:', e);
          }
        };

        applyAudioEnhancements();

        // Connect directly to 1-on-1 Call Room interface
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
            config: {
              role: ZegoUIKitPrebuilt.Host,
            },
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
          videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
          onLocalStreamUpdated: (_state: string, _streamId: string, stream: any) => {
            applyAudioEnhancements(stream);
          },
          onUserJoin: (users: any[]) => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Remote participant joined room:', users);
            stopCallAudio();
            playCallConnectedSound();
            setIsRemoteConnected(true);
            onConnectedRef.current?.();
          },
          onUserLeave: () => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Remote user left room');
            stopCallAudio();
            onEndCallRef.current();
          },
          onLeaveRoom: () => {
            if (!isMounted) return;
            console.log('[ZEGOCLOUD] Local user left room');
            stopCallAudio();
            onEndCallRef.current();
          },
        });

        // Periodic safety checks to ensure AEC/ANS/AGC are active once localStream is established
        timer1 = setTimeout(() => {
          if (isMounted) applyAudioEnhancements();
        }, 600);
        timer2 = setTimeout(() => {
          if (isMounted) applyAudioEnhancements();
        }, 1800);

        if (isMounted) {
          setIsInitializing(false);
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
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      stopCallAudio();
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

      {/* 4. Full-Screen ZEGOCLOUD Call Container */}
      <div
        ref={containerRef}
        id="zego-call-container"
        data-zego-call="true"
        style={{ width: '100%', height: '100%', position: 'relative' }}
        className="w-full h-full z-0 zego-uikit-prebuilt [&_.zego-uikit-prebuilt]:!h-full [&_.zego-uikit-prebuilt]:!w-full"
      />
    </div>
  );
}

export default ZegoCallRoom;
