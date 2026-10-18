/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, ShieldAlert } from 'lucide-react';
import { ZEGO_CONFIG } from '@/config/zego';
import { getAvatarColorPair } from '@/config/tokens';
import { stopCallAudio, playCallConnectedSound, playCallEndedSound, unlockAudioSystem } from '@/lib/callAudio';
import { applyZegoAudioFixes } from '@/lib/zegoAudioFixes';
import { DataStore } from '@/lib/dataStore';
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
  const remoteAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const activeRemoteStreamRef = useRef<MediaStream | null>(null);
  const zpRef = useRef<any>(null);
  const onEndCallRef = useRef(onEndCall);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => {
    onEndCallRef.current = onEndCall;
    onConnectedRef.current = onConnected;
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRemoteConnectedState, setIsRemoteConnectedState] = useState(false);
  const isRemoteConnected = isRemoteConnectedState || call.status === 'connected';
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  const otherPersonName = isCaller
    ? call.receiverName || call.receiverUsername
    : call.callerName || call.callerUsername;
  const otherPersonUsername = isCaller ? call.receiverUsername : call.callerUsername;
  const otherPersonAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;
  const colors = getAvatarColorPair(otherPersonUsername || otherPersonName);
  const initials = (otherPersonName || 'User').slice(0, 2).toUpperCase();

  // STAGE 5: Bind remote MediaStream directly to dedicated hardware speaker audio element
  const bindStreamToHardwareSpeaker = useCallback(async (stream: MediaStream, source = 'unknown') => {
    if (!stream) return;
    activeRemoteStreamRef.current = stream;
    const tracks = stream.getAudioTracks();
    console.log(`[ZEGO STAGE 5: HARDWARE SPEAKER] Binding stream to hardware speaker (${source}):`, {
      streamId: stream.id,
      audioTracksCount: tracks.length,
      trackDetails: tracks.map((t) => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
    });

    tracks.forEach((t) => {
      t.enabled = true;
    });

    const audioEl = remoteAudioPlayerRef.current;
    if (audioEl) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.muted = false;
      audioEl.volume = 1.0;

      // Ensure directed to default speaker device if setSinkId is supported
      if (typeof (audioEl as any).setSinkId === 'function') {
        try {
          await (audioEl as any).setSinkId('');
          console.log('[ZEGO STAGE 5: HARDWARE SPEAKER] setSinkId applied successfully (default speaker).');
        } catch (sinkErr) {
          console.warn('[ZEGO STAGE 5: HARDWARE SPEAKER] setSinkId notice:', sinkErr);
        }
      }

      try {
        await audioEl.play();
        console.log('[ZEGO STAGE 5: HARDWARE SPEAKER] Direct hardware audio player playing to speakers successfully!');
        setIsAutoplayBlocked(false);
      } catch (err: any) {
        console.warn('[ZEGO STAGE 5: HARDWARE SPEAKER] Direct hardware audio play() blocked by browser policy:', err?.name, err?.message);
        setIsAutoplayBlocked(true);
      }
    }
  }, []);

  // STAGE 5 & 6: Inspect and unlock all audio elements in the DOM & container
  const unlockAllAudioElements = useCallback((triggerSource = 'interaction') => {
    if (typeof document === 'undefined') return;

    console.log(`[ZEGO STAGE 5: PLAYBACK] unlockAllAudioElements triggered by: ${triggerSource}`);

    // 1. Resume AudioContexts (Web Audio + Zego Express internal ac)
    unlockAudioSystem();
    try {
      const zgEngine = zpRef.current?.express;
      if (zgEngine?.ac && zgEngine.ac.state === 'suspended') {
        zgEngine.ac.resume().then(() => {
          console.log('[ZEGO STAGE 5: PLAYBACK] Resumed Zego express.ac AudioContext successfully.');
        }).catch((e: any) => {
          console.warn('[ZEGO STAGE 5: PLAYBACK] Failed to resume express.ac:', e);
        });
      }
    } catch {}

    // 2. Scan and inspect all audio and video elements
    const allMedia = Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video'));
    let playingCount = 0;
    let blockedCount = 0;

    allMedia.forEach((el, index) => {
      const isLocal = el.id.includes('local') || (el as any)._isLocal;
      const stream = el.srcObject as MediaStream | null;
      const audioTracks = stream ? stream.getAudioTracks() : [];
      const hasAudio = el.tagName === 'AUDIO' || audioTracks.length > 0;

      console.log(`[ZEGO STAGE 5 & 6: ELEMENT #${index}] <${el.tagName.toLowerCase()} id="${el.id || 'none'}">:`, {
        hasSrcObject: Boolean(stream),
        audioTracks: audioTracks.map((t) => ({ id: t.id, enabled: t.enabled, muted: t.muted, readyState: t.readyState })),
        elementMuted: el.muted,
        elementVolume: el.volume,
        elementPaused: el.paused,
        currentTime: el.currentTime,
      });

      // Remote audio-bearing element: ensure unmuted, maximum volume, live enabled tracks, and active playback
      if (!isLocal && hasAudio) {
        audioTracks.forEach((t) => {
          if (!t.enabled) {
            console.log(`[ZEGO STAGE 6: MUTE CONTROLS] Re-enabling disabled audio track: ${t.id}`);
            t.enabled = true;
          }
        });

        if (el.muted) {
          console.log(`[ZEGO STAGE 6: MUTE CONTROLS] Unmuting remote media element #${index}`);
          el.muted = false;
        }

        if (el.volume < 1) {
          el.volume = 1.0;
        }

        if (el.paused) {
          const p = el.play();
          if (p !== undefined) {
            p.then(() => {
              console.log(`[ZEGO STAGE 5: PLAYBACK] el.play() resolved successfully for element #${index}`);
              playingCount++;
              setIsAutoplayBlocked(false);
            }).catch((err: any) => {
              console.warn(`[ZEGO STAGE 5: PLAYBACK] el.play() BLOCKED by browser autoplay for element #${index}:`, err?.name, err?.message);
              blockedCount++;
              setIsAutoplayBlocked(true);
            });
          }
        } else {
          playingCount++;
        }
      }
    });

    // 3. Guarantee dedicated hardware speaker player is active and playing
    const hwEl = remoteAudioPlayerRef.current;
    if (hwEl) {
      if (!hwEl.srcObject && activeRemoteStreamRef.current) {
        hwEl.srcObject = activeRemoteStreamRef.current;
      }
      if (hwEl.srcObject) {
        hwEl.muted = false;
        hwEl.volume = 1.0;
        if (hwEl.paused) {
          hwEl.play().then(() => {
            console.log('[ZEGO STAGE 5: HARDWARE SPEAKER] hwEl.play() resolved successfully to speakers');
            playingCount++;
            setIsAutoplayBlocked(false);
          }).catch((err: any) => {
            console.warn('[ZEGO STAGE 5: HARDWARE SPEAKER] hwEl.play() blocked by browser autoplay:', err?.name, err?.message);
            blockedCount++;
            setIsAutoplayBlocked(true);
          });
        } else {
          playingCount++;
        }
      }
    }

    if (blockedCount === 0 && playingCount > 0) {
      setIsAutoplayBlocked(false);
    }
  }, []);

  // Global user interaction listener to unlock any blocked audio immediately on click/touch/keydown
  useEffect(() => {
    const handleInteraction = () => {
      unlockAllAudioElements('user-gesture');
    };
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [unlockAllAudioElements]);

  // If call status changes to connected externally (e.g. from polling or BroadcastChannel), reflect immediately
  useEffect(() => {
    if (call.status === 'connected') {
      stopCallAudio();
      const t = setTimeout(() => {
        unlockAllAudioElements('status-connected-sync');
      }, 50);
      return () => clearTimeout(t);
    }
  }, [call.status, unlockAllAudioElements]);

  // Periodic check to ensure remote audio stream stays attached to hardware speaker
  useEffect(() => {
    if (!isRemoteConnected) return;
    const t1 = setTimeout(() => unlockAllAudioElements('post-connect-400ms'), 400);
    const t2 = setTimeout(() => unlockAllAudioElements('post-connect-1200ms'), 1200);
    const t3 = setTimeout(() => unlockAllAudioElements('post-connect-2500ms'), 2500);

    const interval = setInterval(() => {
      const hwEl = remoteAudioPlayerRef.current;
      if (hwEl && activeRemoteStreamRef.current) {
        if (!hwEl.srcObject) {
          hwEl.srcObject = activeRemoteStreamRef.current;
        }
        if (hwEl.muted) hwEl.muted = false;
        if (hwEl.volume < 1) hwEl.volume = 1.0;
        if (hwEl.paused) {
          hwEl.play().catch(() => {});
        }
      }
      unlockAllAudioElements('periodic-speaker-check');
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, [isRemoteConnected, unlockAllAudioElements]);

  const handleContainerInteraction = useCallback(() => {
    const hw = remoteAudioPlayerRef.current;
    if (hw) {
      if (!hw.srcObject && activeRemoteStreamRef.current) {
        hw.srcObject = activeRemoteStreamRef.current;
      }
      hw.muted = false;
      hw.volume = 1.0;
      hw.play().catch(() => {});
    }
    unlockAllAudioElements('container-interaction');
  }, [unlockAllAudioElements]);

  useEffect(() => {
    let isMounted = true;
    const containerEl = containerRef.current;
    const remoteAudioEl = remoteAudioPlayerRef.current;

    async function initZego() {
      if (!containerEl) return;
      try {
        // Apply protective client-side audio wrappers (bugs 1-6)
        applyZegoAudioFixes();

        // Check WebRTC Secure Context
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          setInitError('Microphone & Camera require a secure HTTPS connection. Please connect to DPS Buzz over HTTPS.');
          setIsInitializing(false);
          return;
        }

        // STAGE 7: SDK Compatibility check
        console.log('[ZEGO STAGE 7: SDK COMPATIBILITY] Initializing @zegocloud/zego-uikit-prebuilt v2.18.4');

        // STAGE 1: Microphone permission and local audio capture pre-flight check
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            console.log('[ZEGO STAGE 1: MIC] Checking microphone permissions & pre-warming capture...');
            const preflightStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: Boolean(call.isVideo),
            });
            const aTracks = preflightStream.getAudioTracks();
            console.log('[ZEGO STAGE 1: MIC] Microphone capture test SUCCESS:', {
              audioTrackCount: aTracks.length,
              label: aTracks[0]?.label || 'Standard Microphone',
              enabled: aTracks[0]?.enabled,
              muted: aTracks[0]?.muted,
              readyState: aTracks[0]?.readyState,
            });
            // Stop temporary test tracks so ZEGOCLOUD captures cleanly without device lock
            preflightStream.getTracks().forEach((t) => t.stop());
          } catch (micErr: any) {
            console.warn('[ZEGO STAGE 1: MIC] Pre-flight microphone access warning (ZEGO will prompt):', micErr?.name, micErr?.message);
          }
        }

        // STAGE 5: Enumerate audio output devices (speakers)
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const speakers = devices.filter((d) => d.kind === 'audiooutput');
            console.log('[ZEGO STAGE 5: SPEAKER] Enumerated audio output devices:', {
              speakerCount: speakers.length,
              speakers: speakers.map((s) => ({
                deviceId: s.deviceId,
                label: s.label || 'Default Audio Output / Speaker',
              })),
            });
          } catch (e) {
            console.warn('[ZEGO STAGE 5: SPEAKER] Enumerate audiooutput devices notice:', e);
          }
        }

        const mod = await import('@zegocloud/zego-uikit-prebuilt');
        const ZegoUIKitPrebuilt = (mod as any).ZegoUIKitPrebuilt || (mod as any).default?.ZegoUIKitPrebuilt || (mod as any).default;
        if (!isMounted || !containerEl || !ZegoUIKitPrebuilt) return;

        const roomID = getDeterministicRoomId(call);

        // Explicitly guarantee unique cleanUserID for caller vs receiver to avoid collision
        const baseUsername = isCaller
          ? (call.callerUsername || 'caller').toLowerCase().trim()
          : (call.receiverUsername || 'receiver').toLowerCase().trim();
        const roleSuffix = isCaller ? 'caller' : 'receiver';
        const cleanUserID = `${baseUsername.replace(/[^a-zA-Z0-9_]/g, '_')}_${roleSuffix}`.slice(0, 50);

        const displayName = isCaller
          ? (call.callerName || call.callerUsername || 'Caller')
          : (call.receiverName || call.receiverUsername || 'Receiver');

        console.log('[ZEGO STAGE 2: ROOM] Requesting secure server token for room:', {
          appID: ZEGO_CONFIG.appID,
          roomID,
          cleanUserID,
          displayName,
          isVideo: call.isVideo,
          isCaller,
        });

        // Request secure call token from server (no serverSecret in browser!)
        let kitToken = '';
        try {
          const tokenRes = await fetch('/api/calls/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: roomID,
              userId: cleanUserID,
              userName: displayName,
            }),
          });
          const tokenData = await tokenRes.json();
          if (tokenData.success && tokenData.token) {
            kitToken = tokenData.token;
          }
        } catch (tokenErr) {
          console.error('[ZEGO] Error fetching server call token:', tokenErr);
        }

        if (!kitToken) {
          throw new Error('Unable to obtain secure call authorization from server.');
        }

        // Create ZegoUIKit instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        (zp as any).autoLeaveRoomWhenOnlySelfInRoom = false;
        zpRef.current = zp;

        // STAGE 7: Log underlying express engine version
        if (zp.express?.getVersion) {
          console.log('[ZEGO STAGE 7: SDK COMPATIBILITY] Underlying ZegoExpressEngine version:', zp.express.getVersion());
        }

        // STAGE 2: Listen to roomStateChanged on underlying ZegoExpressEngine
        if (zp.express?.on) {
          zp.express.on('roomStateChanged', (rID: string, reason: string, errorCode: number, extendedData: string) => {
            console.log('[ZEGO STAGE 2: ROOM] roomStateChanged event:', {
              roomID: rID,
              reason, // 1: Logined, 2: LoginFailed, 3: Reconnecting, 4: Reconnected, 5: ReconnectFailed, 6: KickOut, 7: Logout
              errorCode,
              extendedData,
            });
          });

          // STAGE 3: Listen to publisherStateUpdate & publishQualityUpdate
          zp.express.on('publisherStateUpdate', (result: any) => {
            console.log('[ZEGO STAGE 3: PUBLISH] publisherStateUpdate event:', {
              streamID: result?.streamID,
              state: result?.state, // 0: NO_PUBLISH, 1: PUBLISH_REQUESTING, 2: PUBLISHING
              errorCode: result?.errorCode,
            });
          });

          zp.express.on('publishQualityUpdate', (streamID: string, stats: any) => {
            console.log('[ZEGO STAGE 3: PUBLISH QUALITY] publishQualityUpdate event:', {
              streamID,
              audioBitrate: stats?.audioBitrate,
              audioFPS: stats?.audioFPS,
              audioPacketLostRate: stats?.audioPacketLostRate,
            });
          });

          // STAGE 4 & 5: Listen to roomStreamUpdate and bind directly to hardware speakers
          zp.express.on('roomStreamUpdate', async (rID: string, updateType: 'ADD' | 'DELETE', streamList: any[], extendedData: string) => {
            console.log('[ZEGO STAGE 4: REMOTE STREAM] roomStreamUpdate event:', {
              roomID: rID,
              updateType,
              streamCount: streamList?.length,
              streams: streamList?.map((s) => ({
                streamID: s?.streamID,
                userID: s?.user?.userID,
                userName: s?.user?.userName,
              })),
              extendedData,
            });

            if (updateType === 'ADD' && streamList?.length > 0) {
              for (const item of streamList) {
                if (item?.streamID) {
                  try {
                    console.log('[ZEGO STAGE 4 & 5: SPEAKER] Pulling remote stream with startPlayingStream:', item.streamID);
                    const remoteStream = await zp.express.startPlayingStream(item.streamID);
                    if (remoteStream instanceof MediaStream) {
                      await bindStreamToHardwareSpeaker(remoteStream, 'roomStreamUpdate-startPlayingStream');
                    }
                  } catch (err: any) {
                    console.warn('[ZEGO STAGE 4 & 5: SPEAKER] startPlayingStream notice (may be pulled by UIKit):', err?.name, err?.message);
                  }
                }
              }
              setTimeout(() => unlockAllAudioElements('roomStreamUpdate-ADD'), 400);
              setTimeout(() => unlockAllAudioElements('roomStreamUpdate-ADD-retry'), 1200);
            } else if (updateType === 'DELETE') {
              if (remoteAudioPlayerRef.current) {
                remoteAudioPlayerRef.current.srcObject = null;
              }
              activeRemoteStreamRef.current = null;
            }
          });

          // STAGE 5: Listen to playerStateUpdate & playQualityUpdate
          zp.express.on('playerStateUpdate', (result: any) => {
            console.log('[ZEGO STAGE 5: PLAYBACK] playerStateUpdate event:', {
              streamID: result?.streamID,
              state: result?.state, // 0: NO_PLAY, 1: PLAY_REQUESTING, 2: PLAYING
              errorCode: result?.errorCode,
            });
            if (result?.state === 'PLAYING' || result?.state === 2) {
              setTimeout(() => unlockAllAudioElements('playerStateUpdate-PLAYING'), 300);
            }
          });

          zp.express.on('playQualityUpdate', (streamID: string, stats: any) => {
            if (stats?.audioPacketLostRate > 0 || (stats?.audioBitrate || 0) < 5) {
              console.log('[ZEGO STAGE 5: PLAY QUALITY WARNING] streamID=' + streamID, {
                audioBitrate: stats?.audioBitrate,
                audioFPS: stats?.audioFPS,
                audioPacketLostRate: stats?.audioPacketLostRate,
              });
            }
          });
        }

        // Connect directly to 1-on-1 Call Room interface with native WebRTC audio pipeline
        zp.joinRoom({
          container: containerEl,
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
          showMyCameraToggleButton: Boolean(call.isVideo),
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showRotatingScreenButton: Boolean(call.isVideo),
          videoScreenConfig: {
            objectFit: 'cover',
            localMirror: true,
            pullStreamMirror: false,
          },
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          layout: 'Auto',
          showLayoutButton: false,
          showNonVideoUser: true,
          showOnlyAudioUser: true,
          showLeavingView: false,
          showLeaveRoomConfirmDialog: false,
          onJoinRoom: () => {
            console.log('[ZEGO STAGE 2: ROOM] onJoinRoom: Local user joined room successfully:', roomID);
          },
          onLocalStreamUpdated: (state: string, streamId: string, stream?: MediaStream) => {
            const tracks = stream?.getAudioTracks() || zp.localStream?.getAudioTracks() || [];
            console.log(`[ZEGO STAGE 1 & 3: LOCAL STREAM] onLocalStreamUpdated: state=${state}, streamId=${streamId}`, {
              audioTracksCount: tracks.length,
              tracks: tracks.map((t: MediaStreamTrack) => ({
                id: t.id,
                label: t.label,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState,
              })),
            });
          },
          onMicrophoneStateUpdated: (state: 'ON' | 'OFF') => {
            console.log('[ZEGO STAGE 1 & 6: MIC STATE] onMicrophoneStateUpdated:', state);
          },
          onCameraStateUpdated: (state: 'ON' | 'OFF') => {
            console.log('[ZEGO CAMERA STATE] onCameraStateUpdated:', state);
          },
          onStreamUpdate: async (streamId: string) => {
            console.log('[ZEGO STAGE 4: REMOTE STREAM] onStreamUpdate streamId:', streamId);
            try {
              const core = (mod.ZegoUIKitPrebuilt as any)?.core;
              const mapped = core?.remoteStreamMap?.[streamId]?.media;
              if (mapped instanceof MediaStream) {
                await bindStreamToHardwareSpeaker(mapped, 'onStreamUpdate-coreMap');
              } else {
                const remoteStream = await zp.express.startPlayingStream(streamId);
                if (remoteStream instanceof MediaStream) {
                  await bindStreamToHardwareSpeaker(remoteStream, 'onStreamUpdate-express');
                }
              }
            } catch (e: any) {
              console.warn('[ZEGO STAGE 4: REMOTE STREAM] onStreamUpdate stream binding:', e);
            }
            setTimeout(() => unlockAllAudioElements('onStreamUpdate'), 400);
          },
          onUserJoin: (users: any[]) => {
            if (!isMounted) return;
            console.log('[ZEGO STAGE 2: ROOM] Remote participant connected (onUserJoin):', users);
            stopCallAudio();
            playCallConnectedSound();
            setIsRemoteConnectedState(true);
            onConnectedRef.current?.();

            try {
              const core = (mod.ZegoUIKitPrebuilt as any)?.core;
              if (core?.remoteStreamMap) {
                for (const k of Object.keys(core.remoteStreamMap)) {
                  const m = core.remoteStreamMap[k]?.media;
                  if (m instanceof MediaStream) {
                    bindStreamToHardwareSpeaker(m, 'onUserJoin-coreMap');
                    break;
                  }
                }
              }
            } catch {}

            setTimeout(() => unlockAllAudioElements('onUserJoin-connected'), 300);
          },
          onUserLeave: () => {
            if (!isMounted) return;
            console.log('[ZEGO STAGE 2: ROOM] Remote participant hung up (onUserLeave)');
            stopCallAudio();
            playCallEndedSound();
            if (remoteAudioPlayerRef.current) {
              remoteAudioPlayerRef.current.srcObject = null;
            }
            activeRemoteStreamRef.current = null;
            onEndCallRef.current();
          },
          onLeaveRoom: () => {
            if (!isMounted) return;
            console.log('[ZEGO STAGE 2: ROOM] Local user left call (onLeaveRoom)');
            stopCallAudio();
            if (remoteAudioPlayerRef.current) {
              remoteAudioPlayerRef.current.srcObject = null;
            }
            activeRemoteStreamRef.current = null;
            onEndCallRef.current();
          },
        });

        if (isMounted) {
          setIsInitializing(false);
          try {
            const core = (mod.ZegoUIKitPrebuilt as any)?.core;
            if (core?.remoteStreamMap) {
              for (const k of Object.keys(core.remoteStreamMap)) {
                const m = core.remoteStreamMap[k]?.media;
                if (m instanceof MediaStream) {
                  bindStreamToHardwareSpeaker(m, 'init-complete-coreMap');
                  break;
                }
              }
            }
          } catch {}
          unlockAllAudioElements('init-complete');
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

    const handleDeviceChange = () => {
      console.log('[ZEGO AUDIO] Audio output devicechange event detected.');
      if (remoteAudioPlayerRef.current) {
        remoteAudioPlayerRef.current.play().catch(() => {});
      }
    };
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      isMounted = false;
      stopCallAudio();
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      if (remoteAudioEl) {
        remoteAudioEl.srcObject = null;
      }
      activeRemoteStreamRef.current = null;
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (e) {
          console.warn('[ZEGOCLOUD] Error destroying instance:', e);
        }
        zpRef.current = null;
      }
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, [call?.callId, call?.status, call?.isVideo, isCaller, unlockAllAudioElements, bindStreamToHardwareSpeaker]);

  const handleReportCall = async () => {
    try {
      const user = DataStore.getCurrentUser();
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call',
          targetUser: otherPersonUsername,
          reporterUsername: user?.username || 'anonymous',
          reporterReason: 'Inappropriate behavior / harassment during live call',
          contentSnippet: `Live call session room: ${call.callId}`,
          urgency: 'high',
        }),
      });
      setSafetyNotice('Call reported to school administration.');
      setTimeout(() => setShowSafetyModal(false), 1500);
    } catch {
      setSafetyNotice('Report submitted.');
      setTimeout(() => setShowSafetyModal(false), 1500);
    }
  };

  const handleBlockAndEnd = () => {
    const user = DataStore.getCurrentUser();
    if (user?.username && otherPersonUsername) {
      DataStore.blockUser(user.username, otherPersonUsername);
    }
    stopCallAudio();
    onEndCallRef.current();
  };

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

      {/* 3. STAGE 5: User-Triggered Audio Unlock Action (Shown if browser blocks autoplay) */}
      {isAutoplayBlocked && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const hw = remoteAudioPlayerRef.current;
              if (hw) {
                if (!hw.srcObject && activeRemoteStreamRef.current) {
                  hw.srcObject = activeRemoteStreamRef.current;
                }
                hw.muted = false;
                hw.volume = 1.0;
                hw.play().catch(() => {});
              }
              unlockAllAudioElements('manual-unlock-button');
              setIsAutoplayBlocked(false);
            }}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs shadow-2xl flex items-center gap-2 cursor-pointer border border-amber-300 active:scale-95 transition-transform"
            aria-label="Enable sound"
          >
            <Volume2 size={16} />
            <span>🔊 Tap to Unmute / Enable Audio (Autoplay Blocked)</span>
          </button>
        </div>
      )}

      {/* In-Call Student Safety & Report Button */}
      {!initError && (
        <div className="absolute top-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setShowSafetyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 shadow-lg cursor-pointer transition-colors"
            aria-label="Call Safety and Report Options"
          >
            <ShieldAlert size={14} className="text-amber-400" />
            <span>Safety</span>
          </button>
        </div>
      )}

      {/* Safety Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Call Safety & Moderation</h3>
                <p className="text-xs text-neutral-400">Class 6–10 Student Protection</p>
              </div>
            </div>

            {safetyNotice ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium">
                {safetyNotice}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-neutral-300">
                  If another student is acting inappropriately or making you feel uncomfortable, you can report them to school staff or block them immediately.
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleReportCall}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer text-left flex items-center justify-between"
                  >
                    <span>⚠️ Report Call for Inappropriate Behavior</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBlockAndEnd}
                    className="w-full py-2.5 px-3 rounded-xl bg-red-600/30 hover:bg-red-600/40 text-red-200 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer text-left flex items-center justify-between"
                  >
                    <span>🚫 Block Student & End Call Immediately</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowSafetyModal(false);
                setSafetyNotice(null);
              }}
              className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Connection Error Banner */}
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

      {/* 5. Dedicated Hardware Audio Player for Speakers (routes WebRTC MediaStream directly to physical speakers) */}
      <audio
        ref={remoteAudioPlayerRef}
        id="dpsbuzz-hardware-speaker-player"
        autoPlay
        playsInline
        aria-hidden="true"
        className="hidden"
      />

      {/* 6. Full-Screen ZEGOCLOUD Call Container with Native WebRTC audio & video pipeline */}
      <div
        ref={containerRef}
        id="zego-call-container"
        data-zego-call="true"
        onTouchStart={handleContainerInteraction}
        onClick={handleContainerInteraction}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        className="w-full h-full relative overflow-hidden z-0 zego-uikit-prebuilt"
      />
    </div>
  );
}

export default ZegoCallRoom;
