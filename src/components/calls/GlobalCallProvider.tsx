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
import { showBackgroundNotification } from '@/lib/pushNotifications';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // 1. Google High-Availability Global STUN (IPv4 & IPv6 Anycast)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    // 2. Cloudflare Global Edge STUN
    { urls: 'stun:stun.cloudflare.com:3478' },

    // 3. Twilio Global Anycast STUN
    { urls: 'stun:global.stun.twilio.com:3478' },

    // 4. Metered Relay STUN
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'stun:relay.metered.ca:80' },

    // 5. Metered Global Relay TURN over UDP port 80 & 443
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },

    // 6. Metered Global Relay TURN over TCP port 80 & 443 (Critical for mobile 4G/5G CGNAT / Symmetric NAT)
    {
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },

    // 7. Metered Secure TURNS over TLS/TCP port 443
    {
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },

    // 8. Regional Relay Backup
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

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

async function waitForIceGathering(pc: RTCPeerConnection, maxTimeoutMs = 2500): Promise<void> {
  if (pc.iceGatheringState === 'complete') return;
  return new Promise((resolve) => {
    let timer: any = null;
    const checkState = () => {
      if (pc.iceGatheringState === 'complete') {
        if (timer) clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', checkState);
    timer = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', checkState);
      resolve();
    }, maxTimeoutMs);
  });
}

// Synthetic silent audio track generator for hardware-less environments
function createSyntheticAudioTrack(): MediaStreamTrack | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0; // Completely silent
      const dst = ctx.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      if (track) return track;
    }
  } catch {}
  return null;
}

// Ensure candidate preserves sdpMid and sdpMLineIndex for valid WebRTC audio/video routing
function serializeCandidate(c: RTCIceCandidate) {
  return {
    candidate: c.candidate,
    sdpMid: c.sdpMid !== null && c.sdpMid !== undefined ? c.sdpMid : '0',
    sdpMLineIndex: c.sdpMLineIndex !== null && c.sdpMLineIndex !== undefined ? c.sdpMLineIndex : 0,
    usernameFragment: c.usernameFragment || undefined,
  };
}

// Synthetic video track generator
function createSyntheticVideoTrack(label: string): MediaStreamTrack | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const draw = () => {
      if (ctx) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#ec4899';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🐝 DPS Buzz', 320, 220);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '18px sans-serif';
        ctx.fillText(label || 'Live Camera Feed', 320, 260);
      }
    };
    draw();
    const interval = setInterval(draw, 1000);
    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(10) : null;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const origStop = track.stop.bind(track);
        track.stop = () => {
          clearInterval(interval);
          origStop();
        };
        return track;
      }
    }
    clearInterval(interval);
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
  const remoteMediaStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<any>(null);
  const answeringCallIdRef = useRef<string | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const pendingRemoteCandidatesRef = useRef<any[]>([]);
  const consecutiveMissedPollsRef = useRef(0);

  // Ingest ICE candidate with automatic queueing if remote description is not yet set
  const ingestIceCandidate = useCallback(async (pc: RTCPeerConnection, cand: any) => {
    try {
      if (!cand) return;
      const raw = cand.candidate !== undefined ? cand.candidate : cand;
      if (!raw) return;

      const rawString = typeof raw === 'string' ? raw : (raw.candidate || JSON.stringify(raw));
      if (!rawString) return;

      if (processedCandidatesRef.current.has(rawString)) return;
      processedCandidatesRef.current.add(rawString);

      const candidateInit: RTCIceCandidateInit = typeof raw === 'string'
        ? { candidate: raw, sdpMid: '0', sdpMLineIndex: 0 }
        : {
            candidate: raw.candidate || rawString,
            sdpMid: raw.sdpMid !== undefined && raw.sdpMid !== null ? String(raw.sdpMid) : '0',
            sdpMLineIndex: raw.sdpMLineIndex !== undefined && raw.sdpMLineIndex !== null ? Number(raw.sdpMLineIndex) : 0,
            usernameFragment: raw.usernameFragment,
          };

      if (!candidateInit.candidate) return;

      if (pc.remoteDescription && pc.remoteDescription.type) {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } else {
        pendingRemoteCandidatesRef.current.push(candidateInit);
      }
    } catch (err) {
      console.warn('[WebRTC] Candidate ingestion non-fatal error:', err);
    }
  }, []);

  // Flush queued candidates once remote description is set
  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || !pc.remoteDescription.type) return;
    while (pendingRemoteCandidatesRef.current.length > 0) {
      const cand = pendingRemoteCandidatesRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
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

    if (remoteMediaStreamRef.current) {
      remoteMediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      remoteMediaStreamRef.current = null;
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
    pendingRemoteCandidatesRef.current = [];
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
          callerUsername: incomingCall.callerUsername,
          receiverUsername: incomingCall.receiverUsername,
        }),
      });
      broadcastCallEvent({ type: 'CALL_REJECTED', callId: incomingCall.callId });
    } catch {}

    setIncomingCall(null);
  }, [incomingCall, logCallToChat]);

  // Resilient media stream setup with optimal audio constraints and hardware fallback
  const setupMediaStream = async (wantVideo: boolean) => {
    let audioTrack: MediaStreamTrack | null = null;
    let videoTrack: MediaStreamTrack | null = null;

    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      if (wantVideo) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
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
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
            audioTrack = audioOnly.getAudioTracks()[0] || null;
          } catch (aErr: any) {
            try {
              const basicAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioTrack = basicAudio.getAudioTracks()[0] || null;
            } catch (fallbackErr: any) {
              console.warn('Microphone access restricted, falling back to synthetic track:', fallbackErr);
            }
          }
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
          audioTrack = stream.getAudioTracks()[0] || null;
        } catch (mediaErr: any) {
          console.warn('Optimized mic setup failed, attempting basic audio:', mediaErr);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTrack = stream.getAudioTracks()[0] || null;
          } catch (aErr: any) {
            console.warn('Microphone access restricted, falling back to synthetic track:', aErr);
          }
        }
      }
    }

    // Ensure valid tracks exist so WebRTC negotiation can always complete
    if (!audioTrack) {
      audioTrack = createSyntheticAudioTrack();
    } else {
      audioTrack.enabled = true;
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
    playCallConnectedSound();
    if (!incomingCall) return;

    const callToAccept = incomingCall;
    answeringCallIdRef.current = callToAccept.callId;

    // Immediately place call into connected state so activeCall is never null and UI immediately transitions
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

    try {
      const stream = await setupMediaStream(callToAccept.isVideo);
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnRef.current = pc;

      // Add local media tracks to peer connection
      stream.getTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log('[WebRTC] Receiver received remote track:', event.track.kind);
        event.track.enabled = true;
        let targetStream = remoteMediaStreamRef.current;
        if (!targetStream) {
          targetStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
          remoteMediaStreamRef.current = targetStream;
        }
        if (!targetStream.getTracks().some((t) => t.id === event.track.id)) {
          targetStream.addTrack(event.track);
        }
        setRemoteStream(new MediaStream(targetStream.getTracks()));
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] Receiver ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          try { pc.restartIce(); } catch {}
        }
      };

      const handleReceiverDisconnect = () => {
        const cState = pc.connectionState;
        const iState = pc.iceConnectionState;
        console.log('[WebRTC] Receiver connection state:', cState, 'ICE:', iState);
        if (
          cState === 'disconnected' ||
          cState === 'failed' ||
          cState === 'closed' ||
          iState === 'disconnected' ||
          iState === 'failed' ||
          iState === 'closed'
        ) {
          setTimeout(() => {
            const currentPc = peerConnRef.current;
            if (!currentPc) return;
            const cs = currentPc.connectionState;
            const is = currentPc.iceConnectionState;
            if (
              cs === 'disconnected' ||
              cs === 'failed' ||
              cs === 'closed' ||
              is === 'disconnected' ||
              is === 'failed' ||
              is === 'closed'
            ) {
              console.log('[WebRTC] Remote peer disconnected or closed.');
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
            }
          }, 1500);
        }
      };

      pc.onconnectionstatechange = handleReceiverDisconnect;
      pc.oniceconnectionstatechange = handleReceiverDisconnect;

      // Batch receiver ICE candidates in 80ms bursts to prevent HTTP spam
      let candidateBatch: any[] = [];
      let batchTimer: any = null;
      const flushCandidates = () => {
        if (candidateBatch.length === 0) return;
        const toSend = [...candidateBatch];
        candidateBatch = [];
        fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signal',
            callId: callToAccept.callId,
            callerUsername: callToAccept.callerUsername,
            receiverUsername: callToAccept.receiverUsername,
            candidates: toSend,
            sender: 'receiver',
          }),
        }).catch(() => {});
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidateBatch.push(serializeCandidate(event.candidate));
          if (batchTimer) clearTimeout(batchTimer);
          batchTimer = setTimeout(flushCandidates, 80);
        }
      };

      // Retrieve latest caller offer and ICE candidates from server
      let activeOffer = callToAccept.sdpOffer;
      let activeCandidates = callToAccept.iceCandidates || [];
      try {
        const freshRes = await fetch(`/api/calls?callId=${encodeURIComponent(callToAccept.callId)}&t=${Date.now()}`);
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          if (freshData.call?.sdpOffer) {
            activeOffer = freshData.call.sdpOffer;
          }
          if (freshData.call?.iceCandidates) {
            activeCandidates = freshData.call.iceCandidates;
          }
        }
      } catch {}

      let sdpAnswer: any = null;
      if (activeOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(activeOffer));
        await flushPendingCandidates(pc);

        if (activeCandidates) {
          for (const cand of activeCandidates) {
            if (cand.sender === 'caller') {
              await ingestIceCandidate(pc, cand);
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc, 400);
        sdpAnswer = pc.localDescription || answer;
      }

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
          sdpAnswer,
        }),
      });

      flushCandidates();

      const updatedCall: CallSession = {
        ...callToAccept,
        status: 'connected',
        connectedAt: Date.now(),
        sdpAnswer,
      };
      setActiveCall(updatedCall);
      broadcastCallEvent({ type: 'CALL_ANSWERED', call: updatedCall });

      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setDurationSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (e) {
      console.error('Failed to answer call:', e);
      handleEndCall();
    } finally {
      answeringCallIdRef.current = null;
    }
  }, [incomingCall, facingMode, handleEndCall, ingestIceCandidate, flushPendingCandidates]);

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

        // Acquire media devices
        const stream = await setupMediaStream(params.isVideo);

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnRef.current = pc;

        stream.getTracks().forEach((track) => {
          track.enabled = true;
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          console.log('[WebRTC] Caller received remote track:', event.track.kind);
          event.track.enabled = true;
          let targetStream = remoteMediaStreamRef.current;
          if (!targetStream) {
            targetStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
            remoteMediaStreamRef.current = targetStream;
          }
          if (!targetStream.getTracks().some((t) => t.id === event.track.id)) {
            targetStream.addTrack(event.track);
          }
          setRemoteStream(new MediaStream(targetStream.getTracks()));
        };

        const handleCallerDisconnect = () => {
          const cState = pc.connectionState;
          const iState = pc.iceConnectionState;
          console.log('[WebRTC] Caller connection state:', cState, 'ICE:', iState);
          if (
            cState === 'disconnected' ||
            cState === 'failed' ||
            cState === 'closed' ||
            iState === 'disconnected' ||
            iState === 'failed' ||
            iState === 'closed'
          ) {
            setTimeout(() => {
              const currentPc = peerConnRef.current;
              if (!currentPc) return;
              const cs = currentPc.connectionState;
              const is = currentPc.iceConnectionState;
              if (
                cs === 'disconnected' ||
                cs === 'failed' ||
                cs === 'closed' ||
                is === 'disconnected' ||
                is === 'failed' ||
                is === 'closed'
              ) {
                console.log('[WebRTC] Remote peer disconnected or closed.');
                stopCallAudio();
                playCallEndedSound();
                cleanUpCallResources();
                setActiveCall(null);
                setDurationSeconds(0);
              }
            }, 1500);
          }
        };

        pc.onconnectionstatechange = handleCallerDisconnect;
        pc.oniceconnectionstatechange = handleCallerDisconnect;

        // Candidate batching to prevent HTTP queue storms and Cloudinary collisions
        let candidateBatch: any[] = [];
        let batchTimer: any = null;

        const flushCandidates = () => {
          if (candidateBatch.length === 0) return;
          const batch = [...candidateBatch];
          candidateBatch = [];
          fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              callId,
              callerUsername,
              receiverUsername,
              candidates: batch,
              sender: 'caller',
            }),
          }).catch(() => {});
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            candidateBatch.push(serializeCandidate(event.candidate));
            if (batchTimer) clearTimeout(batchTimer);
            batchTimer = setTimeout(flushCandidates, 80);
          }
        };

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: params.isVideo,
        });
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc, 400);
        const completeOffer = pc.localDescription || offer;

        await fetch('/api/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signal',
            callId,
            callerUsername,
            receiverUsername,
            sdpOffer: completeOffer,
            sender: 'caller',
          }),
        });

        flushCandidates();
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
    [cleanUpCallResources, facingMode, playOutgoingRingtone, setupMediaStream, waitForIceGathering, stopCallAudio]
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
          if (!activeCall && !answeringCallIdRef.current && (!incomingCall || incomingCall.callId !== serverCall.callId)) {
            setIncomingCall(serverCall);
            playIncomingRingtone();
            showBackgroundNotification(`📞 Incoming ${serverCall.isVideo ? 'Video' : 'Voice'} Call`, {
              body: `${serverCall.callerName || serverCall.callerUsername} is calling you on DPS Buzz`,
              icon: serverCall.callerAvatar || '/icons/icon-192.png',
              tag: `call-${serverCall.callId}`,
              url: '/chats',
            });
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

            // If we are caller and receiver has answered
            const hasAnswered = isCaller && (serverCall.status === 'connected' || Boolean(serverCall.sdpAnswer));
            if (hasAnswered) {
              if (activeCall.status === 'ringing') {
                console.log('[WebRTC] Receiver answered! Transitioning caller to connected...');
                stopCallAudio();
                playCallConnectedSound();
                setActiveCall({
                  ...serverCall,
                  status: 'connected',
                });
              }

              // Apply remote description whenever sdpAnswer arrives and not yet applied
              if (serverCall.sdpAnswer && peerConnRef.current && !peerConnRef.current.currentRemoteDescription) {
                try {
                  await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(serverCall.sdpAnswer));
                  console.log('[WebRTC] Caller applied receiver SDP answer');
                  await flushPendingCandidates(peerConnRef.current);
                } catch (e) {
                  console.error('[WebRTC] Error setting caller remote description:', e);
                }
              }

              if (!callTimerRef.current) {
                callTimerRef.current = setInterval(() => {
                  setDurationSeconds((prev) => prev + 1);
                }, 1000);
              }
            } else if (serverCall.status === 'rejected') {
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              alert(`${activeCall.receiverName || 'Student'} declined the call.`);
              return;
            } else if (serverCall.status === 'ended') {
              console.log('[WebRTC] Remote peer ended call on server. Terminating locally.');
              stopCallAudio();
              playCallEndedSound();
              cleanUpCallResources();
              setActiveCall(null);
              setDurationSeconds(0);
              return;
            } else if (isCaller && activeCall.status === 'ringing') {
              // Ringing timeout guard while still ringing on server
              const callAge = Date.now() - (activeCall.createdAt || Date.now());
              if (callAge > 45000) {
                stopCallAudio();
                alert(`No answer from @${activeCall.receiverUsername}. They are currently unavailable.`);
                handleEndCall();
                return;
              }
            }

            // SYMMETRIC ICE INGESTION: Both Caller and Receiver ingest remote candidates
            const myRole = isCaller ? 'caller' : 'receiver';
            if (serverCall.iceCandidates && peerConnRef.current) {
              for (const cand of serverCall.iceCandidates) {
                if (cand.sender !== myRole) {
                  await ingestIceCandidate(peerConnRef.current, cand);
                }
              }
            }
          } else {
            // serverCall is absent or mismatched
            if (activeCall.status === 'connected') {
              consecutiveMissedPollsRef.current += 1;
              if (consecutiveMissedPollsRef.current >= 3) {
                console.log('[WebRTC] Active call ended or missing from server for 3 polls. Terminating locally.');
                stopCallAudio();
                playCallEndedSound();
                cleanUpCallResources();
                setActiveCall(null);
                setDurationSeconds(0);
                return;
              }
            } else if (isCaller && activeCall.status === 'ringing') {
              // Ringing timeout guard: after 45 seconds of no answer, end call with unavailable message
              const callAge = Date.now() - (activeCall.createdAt || Date.now());
              if (callAge > 45000) {
                stopCallAudio();
                alert(`No answer from @${activeCall.receiverUsername}. They are currently unavailable.`);
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
          if (!activeCall && !answeringCallIdRef.current && (!incomingCall || incomingCall.callId !== serverCall.callId)) {
            setIncomingCall(serverCall);
            playIncomingRingtone();
            showBackgroundNotification(`📞 Incoming ${serverCall.isVideo ? 'Video' : 'Voice'} Call`, {
              body: `${serverCall.callerName || serverCall.callerUsername} is calling you on DPS Buzz`,
              icon: serverCall.callerAvatar || '/icons/icon-192.png',
              tag: `call-${serverCall.callId}`,
              url: '/chats',
            });
            return;
          }
        }
      }

      if (msg.type === 'CALL_ANSWERED' && msg.call) {
        const serverCall: CallSession = msg.call;
        if (isCaller && activeCall && activeCall.callId === serverCall.callId) {
          stopCallAudio();
          playCallConnectedSound();
          setActiveCall(serverCall);
          if (serverCall.sdpAnswer && peerConnRef.current && !peerConnRef.current.currentRemoteDescription) {
            peerConnRef.current
              .setRemoteDescription(new RTCSessionDescription(serverCall.sdpAnswer))
              .then(async () => {
                if (peerConnRef.current) {
                  await flushPendingCandidates(peerConnRef.current);
                  if (serverCall.iceCandidates) {
                    for (const cand of serverCall.iceCandidates) {
                      if (cand.sender === 'receiver') {
                        await ingestIceCandidate(peerConnRef.current, cand);
                      }
                    }
                  }
                }
              })
              .catch(() => {});
          }
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setDurationSeconds((prev) => prev + 1);
            }, 1000);
          }
          return;
        }
      }

      if (msg.type === 'CALL_ENDED' || msg.type === 'CALL_REJECTED') {
        if (activeCall?.callId === msg.callId || incomingCall?.callId === msg.callId) {
          stopCallAudio();
          playCallEndedSound();
          cleanUpCallResources();
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
  }, [activeCall, incomingCall, isCaller, handleEndCall, cleanUpCallResources]);

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
