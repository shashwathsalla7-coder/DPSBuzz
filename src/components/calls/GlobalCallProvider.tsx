'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import type { CallSession } from '@/app/api/calls/route';
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

const LOCAL_TAB_ID =
  typeof window !== 'undefined'
    ? (window as any).__dpsbuzz_tab_id ||
      ((window as any).__dpsbuzz_tab_id = Math.random().toString(36).substring(2, 9))
    : 'server';

function broadcastCallEvent(payload?: any) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('dpsbuzz_calls_sync');
      bc.postMessage({ ...(payload || {}), senderTabId: LOCAL_TAB_ID });
      bc.close();
    }
  } catch {}
}

export function GlobalCallProvider() {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Compatible stream hook satisfying media stream tracking
  const [, setRemoteStream] = useState<MediaStream | null>(null);
  const handleRemoteTrackUpdate = useCallback((targetStream: MediaStream | null) => {
    if (targetStream) {
      setRemoteStream(new MediaStream(targetStream.getTracks()));
    } else {
      setRemoteStream(null);
    }
  }, []);

  const callTimerRef = useRef<any>(null);
  const answeringCallIdRef = useRef<string | null>(null);
  const consecutiveMissedPollsRef = useRef(0);
  const notifiedIncomingCallIdsRef = useRef<Set<string>>(new Set());
  const endedCallIdsRef = useRef<Set<string>>(new Set());
  const activeCallRef = useRef<CallSession | null>(null);
  activeCallRef.current = activeCall;

  const durationSecondsRef = useRef(0);
  durationSecondsRef.current = durationSeconds;
  const isCallerRef = useRef(false);
  isCallerRef.current = isCaller;
  const incomingCallRef = useRef<CallSession | null>(null);
  incomingCallRef.current = incomingCall;

  // Atomic locks preventing duplicate calls and action double-taps
  const isInitiatingCallRef = useRef(false);
  const isHandlingIncomingActionRef = useRef(false);

  // Preload ZEGOCLOUD bundle in idle time to eliminate startup latency
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        import('@zegocloud/zego-uikit-prebuilt').catch(() => {});
      }, 800);

      // Hydrate ended calls history from localStorage to avoid reviving zombie sessions
      try {
        const stored = localStorage.getItem('dpsbuzz_ended_call_ids_v1');
        if (stored) {
          const list: string[] = JSON.parse(stored);
          list.forEach((id) => endedCallIdsRef.current.add(id));
        }
        localStorage.removeItem('dpsbuzz_active_call_session');
      } catch {}

      return () => clearTimeout(timer);
    }
  }, []);

  // Invalidate and track permanently ended call sessions
  const markCallEnded = useCallback((callId: string) => {
    if (!callId) return;
    endedCallIdsRef.current.add(callId);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = Array.from(endedCallIdsRef.current).slice(-60);
        localStorage.setItem('dpsbuzz_ended_call_ids_v1', JSON.stringify(list));
        localStorage.removeItem('dpsbuzz_active_call_session');
      }
    } catch {}
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

        // Sync to server chat endpoint
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

  // Clean up any remaining resources and unconditionally stop ringtones
  const cleanUpCallResources = useCallback(() => {
    stopCallAudio();
    dismissCallNotifications();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    answeringCallIdRef.current = null;
    isHandlingIncomingActionRef.current = false;
    handleRemoteTrackUpdate(null);
  }, [handleRemoteTrackUpdate]);

  // Terminate active call
  const handleEndCall = useCallback(async () => {
    stopCallAudio();
    playCallEndedSound();
    dismissCallNotifications();

    const currentCall = activeCallRef.current;
    const dur = durationSecondsRef.current;
    const callerFlag = isCallerRef.current;

    if (currentCall) {
      markCallEnded(currentCall.callId);
      const otherUser = callerFlag ? currentCall.receiverUsername : currentCall.callerUsername;
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
  }, [logCallToChat, cleanUpCallResources, markCallEnded]);

  // Decline incoming call
  const handleRejectIncomingCall = useCallback(async () => {
    const callToReject = incomingCallRef.current;
    if (!callToReject || isHandlingIncomingActionRef.current) return;
    isHandlingIncomingActionRef.current = true;

    stopCallAudio();
    playCallEndedSound();
    dismissCallNotifications();

    markCallEnded(callToReject.callId);
    const caller = callToReject.callerUsername;
    logCallToChat(caller, callToReject.isVideo, 0, false);

    setIncomingCall(null);

    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          callId: callToReject.callId,
          callerUsername: callToReject.callerUsername,
          receiverUsername: callToReject.receiverUsername,
        }),
      });
      broadcastCallEvent({ type: 'CALL_REJECTED', callId: callToReject.callId });
    } catch {} finally {
      isHandlingIncomingActionRef.current = false;
    }
  }, [logCallToChat, markCallEnded]);

  // Accept incoming call
  const handleAcceptIncomingCall = useCallback(async () => {
    const callToAccept = incomingCallRef.current;
    if (!callToAccept || isHandlingIncomingActionRef.current) return;
    isHandlingIncomingActionRef.current = true;

    // Unlock Web Audio immediately within user tap gesture
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

    cleanUpCallResources();
    answeringCallIdRef.current = callToAccept.callId;

    try {
      playCallConnectedSound();

      const answeringCall: CallSession = {
        ...callToAccept,
        status: 'connected',
        connectedAt: Date.now(),
      };
      setActiveCall(answeringCall);
      setIncomingCall(null);
      setIsCaller(false);
      setDurationSeconds(0);

      // Notify server of answer so caller immediately connects
      const answerRes = await fetch('/api/calls', {
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

      if (!answerRes.ok) {
        throw new Error('Server returned error while answering call');
      }

      const answerData = await answerRes.json();
      if (!answerData.success) {
        stopCallAudio();
        playCallEndedSound();
        markCallEnded(callToAccept.callId);
        setActiveCall(null);
        alert(answerData.error || 'This call was already ended by the caller.');
        return;
      }

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
      isHandlingIncomingActionRef.current = false;
    }
  }, [handleEndCall, cleanUpCallResources, markCallEnded]);

  // Initiate outgoing call directly into ZEGOCLOUD Call Room
  const startCall = useCallback(
    async (params: {
      receiverUsername: string;
      receiverName: string;
      receiverAvatar?: string | null;
      isVideo: boolean;
    }) => {
      // 1. Atomic lock preventing duplicate calls
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

      // Connect caller directly to ZEGOCLOUD call room immediately (no intermediate modal swap)
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
        if (
          endedCallIdsRef.current.has(callId) ||
          !activeCallRef.current ||
          activeCallRef.current.callId !== callId
        ) {
          console.log('[Calls] Call was ended/cancelled before initiate response arrived.');
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'end',
              callId,
              callerUsername,
              receiverUsername: params.receiverUsername,
            }),
          }).catch(() => {});
          return;
        }

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
        }, 1200);
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
        const currentIncoming = incomingCallRef.current;
        const specificCallId = currentActive?.callId || currentIncoming?.callId;
        const callParam = specificCallId ? `&callId=${encodeURIComponent(specificCallId)}` : '';
        const res = await fetch(`/api/calls?username=${encodeURIComponent(currentUsername)}${callParam}&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const serverCall: CallSession | null = data.call || data.activeCall || null;

        // Guard: If this call has already been terminated, purge and disregard
        if (serverCall && endedCallIdsRef.current.has(serverCall.callId)) {
          if (currentIncoming?.callId === serverCall.callId) {
            setIncomingCall(null);
            stopCallAudio();
            dismissCallNotifications();
          }
          if (currentActive?.callId === serverCall.callId) {
            cleanUpCallResources();
            setActiveCall(null);
          }
          return;
        }

        // Case 1: Incoming call arrived for current user while idle
        if (serverCall && serverCall.receiverUsername === currentUsername && serverCall.status === 'ringing') {
          if (
            !currentActive &&
            !answeringCallIdRef.current &&
            (!currentIncoming || currentIncoming.callId !== serverCall.callId) &&
            !endedCallIdsRef.current.has(serverCall.callId)
          ) {
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
        if (currentIncoming) {
          if (!serverCall || serverCall.status === 'ended' || serverCall.status === 'rejected') {
            console.log('[Calls] Incoming call cancelled or ended by caller');
            markCallEnded(currentIncoming.callId);
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
            const hasAnswered = isCallerRef.current && serverCall.status === 'connected';
            if (hasAnswered) {
              if (currentActive.status === 'ringing') {
                console.log('[ZEGOCLOUD] Receiver answered! Transitioning caller to connected...');
                stopCallAudio();
                playCallConnectedSound();
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
              markCallEnded(currentActive.callId);
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              if (isCallerRef.current) {
                alert(`${currentActive.receiverName || 'Student'} declined the call.`);
              }
              return;
            } else if (serverCall.status === 'ended') {
              console.log('[Calls] Remote peer ended call on server. Terminating locally.');
              markCallEnded(currentActive.callId);
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              return;
            } else if (isCallerRef.current && currentActive.status === 'ringing') {
              // Ringing timeout guard while still ringing on server (45s)
              const callAge = Date.now() - (currentActive.createdAt || Date.now());
              if (callAge > 45000) {
                stopCallAudio();
                playCallEndedSound();
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
                markCallEnded(currentActive.callId);
                stopCallAudio();
                playCallEndedSound();
                cleanUpCallResources();
                setActiveCall(null);
                setDurationSeconds(0);
                return;
              }
            } else if (isCallerRef.current && currentActive.status === 'ringing') {
              consecutiveMissedPollsRef.current += 1;
              const callAge = Date.now() - (currentActive.createdAt || Date.now());
              if (consecutiveMissedPollsRef.current >= 3 || callAge > 45000) {
                console.log('[Calls] Ringing call ended or missing from server. Terminating caller.');
                markCallEnded(currentActive.callId);
                stopCallAudio();
                playCallEndedSound();
                cleanUpCallResources();
                setActiveCall(null);
                setDurationSeconds(0);
                if (callAge > 45000) {
                  alert(`No answer from @${currentActive.receiverUsername}. They are currently unavailable.`);
                }
                return;
              }
            }
          }
        }
      } catch {}
    };

    // Instant signaling across tabs & windows via BroadcastChannel
    const processSignalMessage = (msg: any) => {
      if (!msg || typeof msg !== 'object') {
        pollCallStatus();
        return;
      }

      if (msg.senderTabId && msg.senderTabId === LOCAL_TAB_ID) {
        // Disregard messages originating from this exact local tab
        return;
      }

      if (msg.type === 'CALL_INITIATED' && msg.call) {
        const serverCall: CallSession = msg.call;
        if (serverCall.receiverUsername === currentUsername && serverCall.status === 'ringing') {
          if (
            !activeCallRef.current &&
            !answeringCallIdRef.current &&
            (!incomingCallRef.current || incomingCallRef.current.callId !== serverCall.callId) &&
            !endedCallIdsRef.current.has(serverCall.callId)
          ) {
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
        if (isCallerRef.current && currentActive && currentActive.callId === serverCall.callId) {
          stopCallAudio();
          playCallConnectedSound();
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
        if (msg.callId) {
          markCallEnded(msg.callId);
        }
        stopCallAudio();
        playCallEndedSound();
        cleanUpCallResources();
        dismissCallNotifications();
        const currentActive = activeCallRef.current;
        if (currentActive && (!msg.callId || currentActive.callId === msg.callId)) {
          if (msg.type === 'CALL_REJECTED' && isCallerRef.current) {
            alert(`${currentActive.receiverName || 'Student'} declined the call.`);
          }
          setActiveCall(null);
          setDurationSeconds(0);
        }
        setIncomingCall((prev) => (prev && (!msg.callId || prev.callId === msg.callId) ? null : prev));
        return;
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
    pollCallStatus();
    const interval = setInterval(pollCallStatus, 1000);
    return () => {
      isPolling = false;
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [handleEndCall, cleanUpCallResources, markCallEnded]);

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

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRejectIncomingCall}
                className="w-11 h-11 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                aria-label="Decline call"
                title="Decline"
              >
                <PhoneOff size={18} />
              </button>

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

      {/* 2. DIRECT ZEGOCLOUD CALL ROOM INTERFACE (Directly for both Ringing & Connected) */}
      {activeCall && (
        <ZegoCallRoom
          call={activeCall}
          isCaller={isCaller}
          onEndCall={handleEndCall}
          onConnected={() => {
            if (activeCallRef.current?.status !== 'connected') {
              setActiveCall((prev) => (prev ? { ...prev, status: 'connected', connectedAt: Date.now() } : null));
              if (!callTimerRef.current) {
                callTimerRef.current = setInterval(() => {
                  setDurationSeconds((prev) => prev + 1);
                }, 1000);
              }
            }
          }}
        />
      )}
    </>
  );
}

export default GlobalCallProvider;
