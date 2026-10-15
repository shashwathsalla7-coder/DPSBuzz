'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZEGO_CONFIG } from '@/config/zego';
import type { CallSession } from '@/app/api/calls/route';

interface ZegoCallRoomProps {
  call: CallSession;
  isCaller: boolean;
  onEndCall: () => void;
}

export function ZegoCallRoom({ call, isCaller, onEndCall }: ZegoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zpRef = useRef<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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

        // Create deterministic room ID for the 1-on-1 session
        const rawRoomID =
          call.callId ||
          `dpsbuzz_${[call.callerUsername, call.receiverUsername].sort().join('_')}`;
        const roomID = rawRoomID.replace(/[^a-zA-Z0-9_]/g, '_');

        const currentUsername = (isCaller ? call.callerUsername : call.receiverUsername)
          .toLowerCase()
          .trim();
        const currentName = isCaller
          ? call.callerName || call.callerUsername
          : call.receiverName || call.receiverUsername;

        // Generate ZEGOCLOUD kit token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          ZEGO_CONFIG.appID,
          ZEGO_CONFIG.serverSecret,
          roomID,
          currentUsername,
          currentName || currentUsername
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: Boolean(call.isVideo),
          showMyCameraToggleButton: Boolean(call.isVideo),
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
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
          onLeaveRoom: () => {
            onEndCall();
          },
          onUserLeave: () => {
            onEndCall();
          },
        });

        if (isMounted) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('[ZEGOCLOUD] Failed to initialize call room:', err);
        if (isMounted) {
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
        } catch {}
        zpRef.current = null;
      }
    };
  }, [call.callId, call.callerUsername, call.receiverUsername, call.isVideo, isCaller, onEndCall]);

  return (
    <div
      className="fixed inset-0 z-[130] w-full h-full bg-[#0a0a0f] flex flex-col justify-center items-center overflow-hidden"
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
      <div
        ref={containerRef}
        className="w-full h-full z-0 [&_.zego-uikit-prebuilt]:!h-full [&_.zego-uikit-prebuilt]:!w-full"
      />
    </div>
  );
}
