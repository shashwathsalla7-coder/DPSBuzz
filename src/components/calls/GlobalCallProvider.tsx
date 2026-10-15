'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, Shield } from 'lucide-react';
import { DataStore } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';
import type { CallSession } from '@/app/api/calls/route';
import { CallModal } from './CallModal';
import {
  playOutgoingRingtone,
  playIncomingRingtone,
  playCallConnectedSound,
  playCallEndedSound,
  stopCallAudio,
} from '@/lib/callAudio';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' },
    // Public OpenRelay TURN relay servers for symmetric NAT & cellular network traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
  iceCandidatePoolSize: 10,
};

function broadcastCallEvent() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpsbuzz:call_event_sync'));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('dpsbuzz_calls_sync');
        bc.postMessage({ type: 'CALL_STATUS_CHANGED', timestamp: Date.now() });
        bc.close();
      }
    }
  } catch {}
}

// Synthetic audio track generator for hardware-less environments
function createSyntheticAudioTrack(): MediaStreamTrack | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) return track;
    }
  } catch {}
  return null;
}

// Synthetic video track generator
function createSyntheticVideoTrack(label: string): MediaStreamTrack | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐝 DPS Buzz', 320, 220);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText(label || 'Live Camera Feed', 320, 260);
    }
    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) return track;
    }
  } catch {}
  return null;
}

export function GlobalCallProvider() {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isCaller, setIsCaller] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Audio / Video control states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Media streams & WebRTC references
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<any>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const consecutiveMissedPollsRef = useRef(0);

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

  // Clean up WebRTC & Media streams
  const cleanUpCallResources = useCallback(() => {
    stopCallAudio();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }

    if (peerConnRef.current) {
      try {
        peerConnRef.current.close();
      } catch {}
      peerConnRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    processedCandidatesRef.current.clear();
  }, []);

  // Terminate active call
  const handleEndCall = useCallback(async () => {
    playCallEndedSound();
    const currentCall = activeCall;
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
          }),
        });
        broadcastCallEvent();
      } catch {}
    }

    cleanUpCallResources();
    setActiveCall(null);
    setDurationSeconds(0);
  }, [activeCall, isCaller, durationSeconds, logCallToChat, cleanUpCallResources]);

  // Decline incoming call
  const handleRejectIncomingCall = useCallback(async () => {
    stopCallAudio();
    playCallEndedSound();
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
        }),
      });
      broadcastCallEvent();
    } catch {}

    setIncomingCall(null);
  }, [incomingCall, logCallToChat]);

  // Resilient media stream setup with hardware fallback
  const setupMediaStream = async (wantVideo: boolean) => {
    let audioTrack: MediaStreamTrack | null = null;
    let videoTrack: MediaStreamTrack | null = null;

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      if (wantVideo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
          audioTrack = stream.getAudioTracks()[0] || null;
          videoTrack = stream.getVideoTracks()[0] || null;
        } catch (mediaErr: any) {
          console.warn('Camera/mic access error, attempting audio-only fallback:', mediaErr);
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTrack = audioOnly.getAudioTracks()[0] || null;
          } catch (aErr: any) {
            console.warn('Microphone access restricted, falling back to synthetic track:', aErr);
          }
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioTrack = stream.getAudioTracks()[0] || null;
        } catch (mediaErr: any) {
          console.warn('Microphone access restricted, falling back to synthetic track:', mediaErr);
        }
      }
    }

    // Ensure valid tracks exist so WebRTC negotiation can always complete
    if (!audioTrack) {
      audioTrack = createSyntheticAudioTrack();
    }
    if (wantVideo && !videoTrack) {
      videoTrack = createSyntheticVideoTrack('Camera Off');
    }

    const finalStream = new MediaStream();
    if (audioTrack) finalStream.addTrack(audioTrack);
    if (videoTrack) finalStream.addTrack(videoTrack);

    localStreamRef.current = finalStream;
    setLocalStream(finalStream);
    return finalStream;
  };

  // Accept incoming call
  const handleAcceptIncomingCall = useCallback(async () => {
    stopCallAudio();
    playCallConnectedSound();
    if (!incomingCall) return;

    const callToAccept = incomingCall;
    setIncomingCall(null);
    setIsCaller(false);
    setIsMuted(false);
    setIsCameraOff(!callToAccept.isVideo);
    setDurationSeconds(0);

    const stream = await setupMediaStream(callToAccept.isVideo);

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnRef.current = pc;

      // Add local media tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        } else if (event.track) {
          setRemoteStream((prev) => {
            const nextStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
            nextStream.addTrack(event.track);
            return nextStream;
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              callId: callToAccept.callId,
              candidate: event.candidate,
              sender: 'receiver',
            }),
          }).catch(() => {});
        }
      };

      let sdpAnswer: any = null;
      if (callToAccept.sdpOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callToAccept.sdpOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sdpAnswer = answer;
      }

      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          callId: callToAccept.callId,
          sdpAnswer,
        }),
      });
      broadcastCallEvent();

      const updatedCall: CallSession = {
        ...callToAccept,
        status: 'connected',
        connectedAt: Date.now(),
      };
      setActiveCall(updatedCall);

      callTimerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to answer call:', e);
      handleEndCall();
    }
  }, [incomingCall, facingMode, handleEndCall]);

  // Initiate outgoing call
  const startCall = useCallback(
    async (params: {
      receiverUsername: string;
      receiverName: string;
      receiverAvatar?: string | null;
      isVideo: boolean;
    }) => {
      const user = DataStore.getCurrentUser();
      if (!user || !user.username || user.username === 'guest') {
        alert('Please log in to make calls.');
        return;
      }

      const callerUsername = user.username.toLowerCase().trim();
      const receiverUsername = params.receiverUsername.toLowerCase().trim();
      if (callerUsername === receiverUsername) {
        alert('You cannot call your own account.');
        return;
      }

      cleanUpCallResources();
      setIsCaller(true);
      setIsMuted(false);
      setIsCameraOff(!params.isVideo);
      setDurationSeconds(0);

      playOutgoingRingtone();

      const stream = await setupMediaStream(params.isVideo);
      const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          } else if (event.track) {
            setRemoteStream((prev) => {
              const nextStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
              nextStream.addTrack(event.track);
              return nextStream;
            });
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            fetch('/api/calls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'signal',
                callId,
                candidate: event.candidate,
                sender: 'caller',
              }),
            }).catch(() => {});
          }
        };

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: params.isVideo,
        });
        await pc.setLocalDescription(offer);

        const res = await fetch('/api/calls', {
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
            sdpOffer: offer,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}. Call could not be connected.`);
        }

        const data = await res.json();
        if (data.success && data.call) {
          setActiveCall(data.call);
          broadcastCallEvent();
        } else {
          throw new Error(data.error || 'Call could not be placed. Please try again.');
        }
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
      }
    },
    [cleanUpCallResources, facingMode]
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

  // Periodic polling for incoming calls and WebRTC candidate/SDP synchronization
  useEffect(() => {
    const user = DataStore.getCurrentUser();
    const currentUsername = user?.username?.toLowerCase().trim();
    if (!currentUsername || currentUsername === 'guest') return;

    let isPolling = true;

    const pollCallStatus = async () => {
      try {
        if (!isPolling) return;
        const callParam = activeCall?.callId ? `&callId=${encodeURIComponent(activeCall.callId)}` : '';
        const res = await fetch(`/api/calls?username=${encodeURIComponent(currentUsername)}${callParam}&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const serverCall: CallSession | null = data.activeCall || data.call || null;

        // Case 1: Incoming call arrived for current user while idle
        if (serverCall && serverCall.receiverUsername === currentUsername && serverCall.status === 'ringing') {
          if (!activeCall && (!incomingCall || incomingCall.callId !== serverCall.callId)) {
            setIncomingCall(serverCall);
            playIncomingRingtone();
          }
        }

        // Case 2: Incoming call was cancelled or timed out
        if (!serverCall && incomingCall) {
          setIncomingCall(null);
          stopCallAudio();
        }

        // Case 3: Active call state synchronization (For both Caller and Receiver)
        if (activeCall) {
          if (serverCall && serverCall.callId === activeCall.callId) {
            consecutiveMissedPollsRef.current = 0;

            // If we are caller waiting for receiver to answer
            if (isCaller && activeCall.status === 'ringing' && serverCall.status === 'connected') {
              stopCallAudio();
              playCallConnectedSound();
              setActiveCall(serverCall);

              if (serverCall.sdpAnswer && peerConnRef.current && !peerConnRef.current.currentRemoteDescription) {
                await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(serverCall.sdpAnswer));
              }

              if (!callTimerRef.current) {
                callTimerRef.current = setInterval(() => {
                  setDurationSeconds((prev) => prev + 1);
                }, 1000);
              }
            } else if (serverCall.status === 'rejected') {
              stopCallAudio();
              alert(`${activeCall.receiverName || 'Student'} declined the call.`);
              handleEndCall();
              return;
            } else if (serverCall.status === 'ended') {
              stopCallAudio();
              handleEndCall();
              return;
            }

            // SYMMETRIC ICE INGESTION: Both Caller and Receiver ingest remote candidates
            const myRole = isCaller ? 'caller' : 'receiver';
            if (serverCall.iceCandidates && peerConnRef.current && peerConnRef.current.remoteDescription) {
              for (const cand of serverCall.iceCandidates) {
                const key = JSON.stringify(cand);
                if (cand.sender !== myRole && !processedCandidatesRef.current.has(key)) {
                  processedCandidatesRef.current.add(key);
                  try {
                    await peerConnRef.current.addIceCandidate(new RTCIceCandidate(cand.candidate));
                  } catch (err) {
                    console.warn('ICE candidate addition non-fatal error:', err);
                  }
                }
              }
            }
          } else if (activeCall.status === 'connected') {
            const pcState = peerConnRef.current?.connectionState;
            const iceState = peerConnRef.current?.iceConnectionState;
            if (pcState === 'connected' || iceState === 'connected' || iceState === 'completed') {
              // WebRTC media stream is alive peer-to-peer! Do not terminate call due to serverless polling delay
              consecutiveMissedPollsRef.current = 0;
            } else {
              consecutiveMissedPollsRef.current++;
              if (consecutiveMissedPollsRef.current >= 8) {
                handleEndCall();
                return;
              }
            }
          } else if (isCaller && activeCall.status === 'ringing') {
            // Ringing timeout guard: after 35 seconds of no answer, end call with unavailable message
            const callAge = Date.now() - (activeCall.createdAt || Date.now());
            if (callAge > 35000) {
              stopCallAudio();
              alert(`No answer from @${activeCall.receiverUsername}. They are currently unavailable.`);
              handleEndCall();
              return;
            }
          }
        }
      } catch {}
    };

    // 0ms instant signaling across tabs & windows via BroadcastChannel + CustomEvent
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('dpsbuzz_calls_sync');
        bc.onmessage = () => {
          pollCallStatus();
        };
      }
    } catch {}

    const handleLocalSync = () => pollCallStatus();
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
  }, [activeCall, incomingCall, isCaller, handleEndCall]);

  // Audio / Video control toggles
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  const handleSwitchCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
        });
        const newTrack = newStream.getVideoTracks()[0];
        if (newTrack && peerConnRef.current) {
          const sender = peerConnRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newTrack);
          }
        }
        setLocalStream(newStream);
      } catch {}
    }
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerMuted((prev) => !prev);
  };

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

      {/* 2. FULL SCREEN CALL MODAL */}
      {activeCall && (
        <CallModal
          call={activeCall}
          isCaller={isCaller}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isSpeakerMuted={isSpeakerMuted}
          durationSeconds={durationSeconds}
          onToggleMute={handleToggleMute}
          onToggleCamera={handleToggleCamera}
          onSwitchCamera={handleSwitchCamera}
          onToggleSpeaker={handleToggleSpeaker}
          onEndCall={handleEndCall}
        />
      )}
    </>
  );
}

export default GlobalCallProvider;
