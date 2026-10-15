'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import type { CallSession } from '@/app/api/calls/route';
import { CallModal } from './CallModal';
import { ZegoCallRoom } from './ZegoCallRoom';
import {
  playOutgoingRingtone,
  playIncomingRingtone,
  playCallConnectedSound,
  playCallEndedSound,
  stopCallAudio,
} from '@/lib/callAudio';
import { showBackgroundNotification } from '@/lib/pushNotifications';

function dismissCallNotifications() {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.getNotifications().then((notifs) => {
            notifs.forEach((n) => {
              if (n.tag && n.tag.startsWith('call-')) {
                n.close();
              }
            });
          });
        })
        .catch(() => {});
    }
  } catch {}
}

function broadcastCallEvent(payload?: any) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:call_event_sync', { detail: payload }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('dpsbuzz_calls_sync');
        bc.postMessage(payload || { type: 'CALL_STATUS_CHANGED', timestamp: Date.now() });
        bc.close();
      }
    }
  } catch {}
}

export function GlobalCallProvider() {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Audio / Video control states for ringing preview modal
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const callTimerRef = useRef<any>(null);
  const answeringCallIdRef = useRef<string | null>(null);
  const consecutiveMissedPollsRef = useRef(0);
  const notifiedIncomingCallIdsRef = useRef<Set<string>>(new Set());
  const activeCallRef = useRef<CallSession | null>(null);
  activeCallRef.current = activeCall;

  // Atomic lock preventing duplicate calls
  const isInitiatingCallRef = useRef(false);

  // Preload ZEGOCLOUD bundle in idle time to eliminate 4-second freeze on call start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        import('@zegocloud/zego-uikit-prebuilt').catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Log call record into chat history
  const logCallToChat = useCallback(
    (otherUsername: string, isVideo: boolean, duration: number, wasConnected: boolean) => {
      try {
        const user = DataStore.getCurrentUser();
        if (!user || !user.username) return;
        const currentUsername = user.username.toLowerCase().trim();
        const otherUser = otherUsername.toLowerCase().trim();

        // Determine conversation key
        const pair = [currentUsername, otherUser].sort().join('__');
        const icon = isVideo ? '📹' : '📞';
        const typeLabel = isVideo ? 'Video call' : 'Voice call';
        let text = '';

        if (wasConnected && duration > 0) {
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          const durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
          text = `${icon} ${typeLabel} · ${durStr}`;
        } else {
          text = `${icon} Missed ${typeLabel.toLowerCase()}`;
        }

        const logMsg = {
          id: `call-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text,
          sender: 'me' as const,
          senderUsername: currentUsername,
          time: new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(new Date()),
          isCallLog: true,
        };

        // Update local storage
        if (currentUsername && currentUsername !== 'guest') {
          const userMsgKey = `dpsbuzz_chat_messages_${currentUsername}_v3`;
          const savedMsgs = JSON.parse(localStorage.getItem(userMsgKey) || '{}');
          const list = savedMsgs[pair] || [];
          savedMsgs[pair] = [...list, logMsg];
          localStorage.setItem(userMsgKey, JSON.stringify(savedMsgs));
        }

        // Sync to server chat endpoint with sender authentication
        fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: pair,
            senderUsername: currentUsername,
            message: logMsg,
          }),
        }).catch(() => {});
      } catch {}
    },
    []
  );

  // Clean up any remaining resources and stop ringtones
  const cleanUpCallResources = useCallback(() => {
    stopCallAudio();
    dismissCallNotifications();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    answeringCallIdRef.current = null;
  }, []);

  // Terminate active call
  const handleEndCall = useCallback(async () => {
    playCallEndedSound();
    dismissCallNotifications();

    const currentCall = activeCallRef.current;
    const dur = durationSeconds;

    if (currentCall) {
      const otherUser = isCaller ? currentCall.receiverUsername : currentCall.callerUsername;
      const wasConnected = currentCall.status === 'connected';

      logCallToChat(otherUser, currentCall.isVideo, dur, wasConnected);

      try {
        await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            callId: currentCall.callId,
            callerUsername: currentCall.callerUsername,
            receiverUsername: currentCall.receiverUsername,
          }),
        });
        broadcastCallEvent({ type: 'CALL_ENDED', callId: currentCall.callId });
      } catch {}
    }

    cleanUpCallResources();
    setActiveCall(null);
    setDurationSeconds(0);
    isInitiatingCallRef.current = false;
  }, [isCaller, durationSeconds, logCallToChat, cleanUpCallResources]);

  // Decline incoming call
  const handleRejectIncomingCall = useCallback(async () => {
    stopCallAudio();
    playCallEndedSound();
    dismissCallNotifications();

    if (!incomingCall) return;

    const caller = incomingCall.callerUsername;
    logCallToChat(caller, incomingCall.isVideo, 0, false);

    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          callId: incomingCall.callId,
          callerUsername: incomingCall.callerUsername,
          receiverUsername: incomingCall.receiverUsername,
        }),
      });
      broadcastCallEvent({ type: 'CALL_REJECTED', callId: incomingCall.callId });
    } catch {}

    setIncomingCall(null);
  }, [incomingCall, logCallToChat]);

  // Accept incoming call
  const handleAcceptIncomingCall = useCallback(async () => {
    // Unlock Web Audio immediately within the user tap gesture
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const unlockCtx = new AudioCtx();
        if (unlockCtx.state === 'suspended') {
          unlockCtx.resume().catch(() => {});
        }
      }
    } catch {}

    stopCallAudio();
    dismissCallNotifications();

    if (!incomingCall) return;

    const callToAccept = incomingCall;
    cleanUpCallResources();
    answeringCallIdRef.current = callToAccept.callId;

    try {
      // 1. Double check server: Did caller cancel before we pressed answer?
      const checkRes = await fetch(`/api/calls?callId=${encodeURIComponent(callToAccept.callId)}&t=${Date.now()}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        const sc = checkData.call || checkData.activeCall;
        if (!sc || sc.status === 'ended' || sc.status === 'rejected') {
          stopCallAudio();
          playCallEndedSound();
          setIncomingCall(null);
          alert('This call was already ended by the caller.');
          return;
        }
      }

      // 2. Play connected sound and place call into connected state
      playCallConnectedSound();

      const answeringCall: CallSession = {
        ...callToAccept,
        status: 'connected',
        connectedAt: Date.now(),
      };
      setActiveCall(answeringCall);
      setIncomingCall(null);
      setIsCaller(false);
      setIsMuted(false);
      setIsCameraOff(!callToAccept.isVideo);
      setDurationSeconds(0);

      // 3. Notify server of answer so caller immediately connects
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          callId: callToAccept.callId,
          callerUsername: callToAccept.callerUsername,
          receiverUsername: callToAccept.receiverUsername,
          callerName: callToAccept.callerName,
          receiverName: callToAccept.receiverName,
          isVideo: callToAccept.isVideo,
          sender: 'receiver',
        }),
      });

      broadcastCallEvent({ type: 'CALL_ANSWERED', call: answeringCall });

      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (e) {
      console.error('[Calls] Failed to answer call:', e);
      handleEndCall();
    } finally {
      answeringCallIdRef.current = null;
    }
  }, [incomingCall, handleEndCall, cleanUpCallResources]);

  // Initiate outgoing call with strict single-call debounce lock
  const startCall = useCallback(
    async (params: {
      receiverUsername: string;
      receiverName: string;
      receiverAvatar?: string | null;
      isVideo: boolean;
    }) => {
      // 1. Check atomic lock and existing active call
      if (isInitiatingCallRef.current || activeCallRef.current) {
        console.warn('[Calls] A call is already initiating or active. Dropping duplicate call request.');
        return;
      }
      isInitiatingCallRef.current = true;

      const user = DataStore.getCurrentUser();
      if (!user || !user.username || user.username === 'guest') {
        alert('Please log in to make calls.');
        isInitiatingCallRef.current = false;
        return;
      }

      const callerUsername = user.username.toLowerCase().trim();
      const receiverUsername = params.receiverUsername.toLowerCase().trim();
      if (callerUsername === receiverUsername) {
        alert('You cannot call your own account.');
        isInitiatingCallRef.current = false;
        return;
      }

      cleanUpCallResources();
      setIsCaller(true);
      setIsMuted(false);
      setIsCameraOff(!params.isVideo);
      setDurationSeconds(0);

      playOutgoingRingtone();

      const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const initialCall: CallSession = {
        callId,
        callerUsername,
        callerName: user.fullName || callerUsername,
        callerAvatar: user.avatar || null,
        receiverUsername,
        receiverName: params.receiverName,
        receiverAvatar: params.receiverAvatar || null,
        isVideo: params.isVideo,
        status: 'ringing',
        createdAt: Date.now(),
        iceCandidates: [],
      };

      // Show ringing UI on caller immediately
      setActiveCall(initialCall);

      try {
        // Register call on the server IMMEDIATELY so receiver gets ringing notification with 0 delay
        const initRes = await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initiate',
            callId,
            callerUsername,
            callerName: user.fullName || callerUsername,
            callerAvatar: user.avatar || null,
            receiverUsername,
            receiverName: params.receiverName,
            receiverAvatar: params.receiverAvatar || null,
            isVideo: params.isVideo,
          }),
        });

        if (!initRes.ok) {
          throw new Error(`Server returned status ${initRes.status}. Call could not be placed.`);
        }

        const initData = await initRes.json();
        if (!initData.success) {
          throw new Error(initData.error || 'Call could not be placed. Please try again.');
        }

        const activeSession = initData.call || initialCall;
        setActiveCall(activeSession);
        broadcastCallEvent({ type: 'CALL_INITIATED', call: activeSession });
      } catch (err: any) {
        console.error('Failed to initiate call:', err);
        cleanUpCallResources();
        stopCallAudio();
        const errorMsg =
          err?.message || 'Unable to place call. Please check your network and browser permissions.';
        alert(errorMsg);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dpsbuzz:call_error', {
              detail: { message: errorMsg },
            })
          );
        }
      } finally {
        setTimeout(() => {
          isInitiatingCallRef.current = false;
        }, 1500);
      }
    },
    [cleanUpCallResources]
  );

  // Listen for custom start call triggers across the app
  useEffect(() => {
    const handleStartCallEvent = (e: any) => {
      if (e.detail) {
        startCall(e.detail);
      }
    };
    window.addEventListener('dpsbuzz:start_call', handleStartCallEvent);
    return () => window.removeEventListener('dpsbuzz:start_call', handleStartCallEvent);
  }, [startCall]);

  // Periodic polling for incoming calls and connection status
  useEffect(() => {
    const user = DataStore.getCurrentUser();
    const currentUsername = user?.username?.toLowerCase().trim();
    if (!currentUsername || currentUsername === 'guest') return;

    let isPolling = true;

    const pollCallStatus = async () => {
      try {
        if (!isPolling) return;
        const currentActive = activeCallRef.current;
        const specificCallId = currentActive?.callId || incomingCall?.callId;
        const callParam = specificCallId ? `&callId=${encodeURIComponent(specificCallId)}` : '';
        const res = await fetch(`/api/calls?username=${encodeURIComponent(currentUsername)}${callParam}&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const serverCall: CallSession | null = data.call || data.activeCall || null;

        // Case 1: Incoming call arrived for current user while idle
        if (serverCall && serverCall.receiverUsername === currentUsername && serverCall.status === 'ringing') {
          if (!currentActive && !answeringCallIdRef.current && (!incomingCall || incomingCall.callId !== serverCall.callId)) {
            setIncomingCall(serverCall);
            playIncomingRingtone();
            if (!notifiedIncomingCallIdsRef.current.has(serverCall.callId)) {
              notifiedIncomingCallIdsRef.current.add(serverCall.callId);
              showBackgroundNotification(`📞 Incoming ${serverCall.isVideo ? 'Video' : 'Voice'} Call`, {
                body: `${serverCall.callerName || serverCall.callerUsername} is calling you on DPS Buzz`,
                icon: serverCall.callerAvatar || '/icons/icon-192.png',
                tag: `call-${serverCall.callId}`,
                url: '/chats',
              });
            }
          }
        }

        // Case 2: Incoming call was cancelled or timed out
        if (incomingCall) {
          if (!serverCall || serverCall.status === 'ended' || serverCall.status === 'rejected') {
            console.log('[Calls] Incoming call cancelled or ended by caller');
            setIncomingCall(null);
            stopCallAudio();
            playCallEndedSound();
            dismissCallNotifications();
          }
        }

        // Case 3: Active call state synchronization (For both Caller and Receiver)
        if (currentActive) {
          if (serverCall && serverCall.callId === currentActive.callId) {
            consecutiveMissedPollsRef.current = 0;

            // If we are caller and receiver has answered
            const hasAnswered = isCaller && serverCall.status === 'connected';
            if (hasAnswered) {
              if (currentActive.status === 'ringing') {
                console.log('[ZEGOCLOUD] Receiver answered! Transitioning caller to connected...');
                stopCallAudio();
                playCallConnectedSound();
                cleanUpCallResources();
                setActiveCall({
                  ...serverCall,
                  status: 'connected',
                });

                if (!callTimerRef.current) {
                  callTimerRef.current = setInterval(() => {
                    setDurationSeconds((prev) => prev + 1);
                  }, 1000);
                }
              }
            } else if (serverCall.status === 'rejected') {
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              alert(`${currentActive.receiverName || 'Student'} declined the call.`);
              return;
            } else if (serverCall.status === 'ended') {
              console.log('[Calls] Remote peer ended call on server. Terminating locally.');
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              return;
            } else if (isCaller && currentActive.status === 'ringing') {
              // Ringing timeout guard while still ringing on server
              const callAge = Date.now() - (currentActive.createdAt || Date.now());
              if (callAge > 40000) {
                stopCallAudio();
                alert(`No answer from @${currentActive.receiverUsername}. They are currently unavailable.`);
                handleEndCall();
                return;
              }
            }
          } else {
            // serverCall is absent or mismatched
            if (currentActive.status === 'connected') {
              consecutiveMissedPollsRef.current += 1;
              if (consecutiveMissedPollsRef.current >= 8) {
                console.log('[Calls] Active call ended or missing from server. Terminating locally.');
                stopCallAudio();
                playCallEndedSound();
                cleanUpCallResources();
                setActiveCall(null);
                setDurationSeconds(0);
                return;
              }
            } else if (isCaller && currentActive.status === 'ringing') {
              // Ringing timeout guard: after 40 seconds of no answer, end call with unavailable message
              const callAge = Date.now() - (currentActive.createdAt || Date.now());
              if (callAge > 40000) {
                stopCallAudio();
                alert(`No answer from @${currentActive.receiverUsername}. They are currently unavailable.`);
                handleEndCall();
                return;
              }
            }
          }
        }
      } catch {}
    };

    // 0ms instant signaling across tabs & windows via BroadcastChannel + CustomEvent
    const processSignalMessage = (msg: any) => {
      if (!msg || typeof msg !== 'object') {
        pollCallStatus();
        return;
      }

      if (msg.type === 'CALL_INITIATED' && msg.call) {
        const serverCall: CallSession = msg.call;
        if (serverCall.receiverUsername === currentUsername && serverCall.status === 'ringing') {
          if (!activeCallRef.current && !answeringCallIdRef.current && (!incomingCall || incomingCall.callId !== serverCall.callId)) {
            setIncomingCall(serverCall);
            playIncomingRingtone();
            if (!notifiedIncomingCallIdsRef.current.has(serverCall.callId)) {
              notifiedIncomingCallIdsRef.current.add(serverCall.callId);
              showBackgroundNotification(`📞 Incoming ${serverCall.isVideo ? 'Video' : 'Voice'} Call`, {
                body: `${serverCall.callerName || serverCall.callerUsername} is calling you on DPS Buzz`,
                icon: serverCall.callerAvatar || '/icons/icon-192.png',
                tag: `call-${serverCall.callId}`,
                url: '/chats',
              });
            }
            return;
          }
        }
      }

      if (msg.type === 'CALL_ANSWERED' && msg.call) {
        const serverCall: CallSession = msg.call;
        const currentActive = activeCallRef.current;
        if (isCaller && currentActive && currentActive.callId === serverCall.callId) {
          stopCallAudio();
          playCallConnectedSound();
          cleanUpCallResources();
          setActiveCall({
            ...serverCall,
            status: 'connected',
          });
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setDurationSeconds((prev) => prev + 1);
            }, 1000);
          }
          return;
        }
      }

      if (msg.type === 'CALL_ENDED' || msg.type === 'CALL_REJECTED') {
        const currentActive = activeCallRef.current;
        if (currentActive?.callId === msg.callId || incomingCall?.callId === msg.callId) {
          stopCallAudio();
          playCallEndedSound();
          cleanUpCallResources();
          dismissCallNotifications();
          setActiveCall(null);
          setIncomingCall(null);
          setDurationSeconds(0);
          return;
        }
      }

      pollCallStatus();
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_calls_sync');
        bc.onmessage = (ev) => {
          processSignalMessage(ev.data);
        };
      }
    } catch {}

    const handleLocalSync = (ev: any) => processSignalMessage(ev.detail);
    window.addEventListener('dpsbuzz:call_event_sync', handleLocalSync);

    // Initial poll + 1-second fallback interval for cross-device signaling
    pollCallStatus();
    const interval = setInterval(pollCallStatus, 1000);
    return () => {
      isPolling = false;
      clearInterval(interval);
      window.removeEventListener('dpsbuzz:call_event_sync', handleLocalSync);
      if (bc) bc.close();
    };
  }, [incomingCall, isCaller, handleEndCall, cleanUpCallResources]);

  return (
    <>
      {/* 1. INCOMING CALL BANNER / NOTIFICATION OVERLAY */}
      {incomingCall && !activeCall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] w-[92vw] max-w-md animate-slide-up">
          <div
            className="p-4 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 text-white"
            style={{
              backgroundColor: 'rgba(18, 18, 24, 0.94)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Caller Avatar with Pulse */}
              <div className="relative shrink-0">
                <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping" />
                <div
                  className="relative w-12 h-12 rounded-full border-2 border-white/30 flex items-center justify-center font-bold text-sm overflow-hidden"
                  style={{
                    backgroundColor: getAvatarColorPair(incomingCall.callerUsername).bg,
                    color: getAvatarColorPair(incomingCall.callerUsername).text,
                  }}
                >
                  {incomingCall.callerAvatar ? (
                    <img
                      src={incomingCall.callerAvatar}
                      alt={incomingCall.callerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    incomingCall.callerName.slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold truncate leading-tight">
                    {incomingCall.callerName}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-semibold border border-white/15">
                    {incomingCall.isVideo ? '📹 Video' : '📞 Voice'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate">
                  @{incomingCall.callerUsername} is calling...
                </p>
              </div>
            </div>

            {/* Accept / Decline Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Decline */}
              <button
                type="button"
                onClick={handleRejectIncomingCall}
                className="w-11 h-11 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                aria-label="Decline call"
                title="Decline"
              >
                <PhoneOff size={18} />
              </button>

              {/* Accept */}
              <button
                type="button"
                onClick={handleAcceptIncomingCall}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-90 transition-transform cursor-pointer animate-pulse"
                aria-label="Accept call"
                title="Accept"
              >
                {incomingCall.isVideo ? <Video size={19} /> : <Phone size={19} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ZEGOCLOUD ULTRA-HD RTC CALL ROOM (When Connected) */}
      {activeCall && activeCall.status === 'connected' && (
        <ZegoCallRoom
          call={activeCall}
          isCaller={isCaller}
          onEndCall={handleEndCall}
        />
      )}

      {/* 3. RINGING STATE CALL MODAL (Before Answered) */}
      {activeCall && activeCall.status === 'ringing' && (
        <CallModal
          call={activeCall}
          isCaller={isCaller}
          localStream={null}
          remoteStream={null}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isSpeakerMuted={isSpeakerMuted}
          durationSeconds={0}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          onToggleCamera={() => setIsCameraOff((prev) => !prev)}
          onSwitchCamera={() => {}}
          onToggleSpeaker={() => setIsSpeakerMuted((prev) => !prev)}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}

export default GlobalCallProvider;
