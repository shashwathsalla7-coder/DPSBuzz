'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZEGO_CONFIG } from '@/config/zego';
import { DataStore } from '@/lib/dataStore';
import type { CallSession } from '@/app/api/calls/route';

interface ZegoCallRoomProps {
  call: CallSession;
  isCaller: boolean;
  onEndCall: () => void;
}

export function ZegoCallRoom({ call, isCaller, onEndCall }: ZegoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zpRef = useRef<any>(null);
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const otherPersonName = isCaller
    ? call.receiverName || call.receiverUsername
    : call.callerName || call.callerUsername;

  useEffect(() => {
    let isMounted = true;

    async function initZego() {
      if (!containerRef.current) return;
      try {
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
        if (!isMounted || !containerRef.current) return;

        // Clean room ID: alphanumeric and underscores only
        const cleanCallId = (call.callId || '').replace(/[^a-zA-Z0-9_]/g, '_');
        const pairKey = [
          (call.callerUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
          (call.receiverUsername || '').toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '_'),
        ]
          .sort()
          .join('_');

        const roomID = cleanCallId.length > 5 ? `dps_${cleanCallId}` : `dps_${pairKey}`;

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
        });

        // Generate ZEGOCLOUD kit token for test
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_CONFIG.appID,
          ZEGO_CONFIG.serverSecret,
          roomID,
          cleanUserID,
          displayName || cleanUserID
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

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
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: Boolean(call.isVideo),
          showTextChat: false,
          showUserList: false,
          maxUsers: 2,
          layout: 'Auto',
          showLayoutButton: false,
          showNonVideoUser: true,
          showOnlyAudioUser: true,
          showLeavingView: false,
          showLeaveRoomConfirmDialog: false,
          onLeaveRoom: () => {
            console.log('[ZEGOCLOUD] Local user left room');
            onEndCallRef.current();
          },
          onUserLeave: () => {
            console.log('[ZEGOCLOUD] Remote user left room');
            onEndCallRef.current();
          },
        });

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
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.warn('[ZEGOCLOUD] Error destroying instance:', e);
        }
        zpRef.current = null;
      }
    };
  }, [call.callId, call.isVideo, isCaller]);

  return (
    <div
      className="fixed inset-0 z-[130] w-screen h-screen bg-[#0a0a0f] flex flex-col justify-center items-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`${call.isVideo ? 'Video' : 'Voice'} call with ${otherPersonName}`}
    >
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0f] text-white space-y-4 select-none">
          <div className="w-14 h-14 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-white">Connecting Call...</h3>
            <p className="text-xs text-neutral-400 font-medium">
              Establishing HD RTC connection with @{isCaller ? call.receiverUsername : call.callerUsername}
            </p>
          </div>
        </div>
      )}

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
            onClick={() => onEndCallRef.current()}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            Close Call
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: '100vw', height: '100vh', position: 'relative' }}
        className="w-full h-full z-0 [&_.zego-uikit-prebuilt]:!h-full [&_.zego-uikit-prebuilt]:!w-full"
      />
    </div>
  );
}
