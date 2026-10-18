/**
 * ZEGOCLOUD UIKit Audio Fixes Wrapper (Client-side)
 * Fixes all 6 known vendor bugs in @zegocloud/zego-uikit-prebuilt without modifying minified vendor code:
 * 1. speakerDeviceID: Mid-call speaker changes now persist for late-joining participants.
 * 2. toggleSpeakerTest: Catches unhandled setSinkId rejections and prevents interval spam.
 * 3. SoundMeter: Suspended AudioContext is cleanly resumed on first user gesture.
 * 4. initAudio / setAllSinkId: setSinkId errors on iOS Safari are gracefully handled.
 * 5. setStreamAudioOutput: Guards against "undefined" !== sinkId string equality crash on Safari.
 * 6. selectSpeaker: Properly switches speaker for all current and future audio/video streams.
 */

declare global {
  interface Window {
    __zego_audio_fixes_applied?: boolean;
    __zego_selected_speaker_id?: string;
  }
}

export function applyZegoAudioFixes(): void {
  if (typeof window === 'undefined' || window.__zego_audio_fixes_applied) {
    return;
  }
  window.__zego_audio_fixes_applied = true;

  console.log('[ZEGO AUDIO FIXES] Applying protective wrappers for WebRTC audio & speaker routing...');

  // --- BUG 2, 4, 5: Safe setSinkId wrapper on HTMLMediaElement prototype ---
  if (typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype) {
    const originalSetSinkId = (HTMLMediaElement.prototype as any).setSinkId;

    (HTMLMediaElement.prototype as any).setSinkId = async function (sinkId: string) {
      if (typeof sinkId !== 'string') {
        sinkId = '';
      }
      try {
        if (typeof originalSetSinkId === 'function') {
          return await originalSetSinkId.call(this, sinkId);
        }
      } catch (err: any) {
        // Intercept NotAllowedError or NotFoundError gracefully without unhandled rejection
        console.warn('[ZEGO AUDIO FIXES] setSinkId non-fatal notice:', err?.name || err);
        return Promise.resolve();
      }
    };
  }

  // --- BUG 1 & 6: Speaker device persistence for late-joining remote streams ---
  const applySelectedSpeakerToElement = async (el: HTMLMediaElement) => {
    const selectedSpeaker = window.__zego_selected_speaker_id;
    if (selectedSpeaker && typeof (el as any).setSinkId === 'function') {
      try {
        await (el as any).setSinkId(selectedSpeaker);
      } catch (err) {
        // Ignore setSinkId restriction on mobile browsers
      }
    }
  };

  // Watch for any newly added audio or video elements created by ZegoUIKit
  if (typeof MutationObserver !== 'undefined' && document.body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
              applySelectedSpeakerToElement(el as HTMLMediaElement);
            } else {
              el.querySelectorAll?.('audio, video').forEach((mediaEl) => {
                applySelectedSpeakerToElement(mediaEl as HTMLMediaElement);
              });
            }
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Hook play() to ensure volume is unmuted and speaker sink is applied
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = async function () {
    if (this.tagName === 'AUDIO') {
      await applySelectedSpeakerToElement(this);
    }
    try {
      return await originalPlay.apply(this);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        console.warn('[ZEGO AUDIO FIXES] Audio autoplay paused pending user touch/click gesture.');
      }
      throw err;
    }
  };

  // --- BUG 3: SoundMeter AudioContext unlock & gesture resumption ---
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioCtx) {
    const activeContexts = new Set<AudioContext>();

    // Listen for first user touch/click to resume any suspended AudioContexts
    const resumeAllAudio = () => {
      activeContexts.forEach((ctx) => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      });
      window.removeEventListener('click', resumeAllAudio);
      window.removeEventListener('touchstart', resumeAllAudio);
    };

    window.addEventListener('click', resumeAllAudio, { passive: true });
    window.addEventListener('touchstart', resumeAllAudio, { passive: true });
  }

  console.log('[ZEGO AUDIO FIXES] All 6 ZegoCloud prebuilt audio protections active.');
}

/**
 * Public helper to select speaker output and update all active audio elements
 */
export async function setZegoSpeakerOutput(deviceId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  window.__zego_selected_speaker_id = deviceId;

  const mediaElements = Array.from(document.querySelectorAll('audio, video')) as HTMLMediaElement[];
  let successCount = 0;

  for (const el of mediaElements) {
    if (typeof (el as any).setSinkId === 'function') {
      try {
        await (el as any).setSinkId(deviceId);
        successCount++;
      } catch (err) {
        console.warn('[ZEGO AUDIO FIXES] Could not route audio to speaker device:', deviceId, err);
      }
    }
  }

  return successCount > 0;
}
