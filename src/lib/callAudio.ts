// =====================================================
// DPS BUZZ - Web Audio Call Sound Generator
// Generates authentic outgoing ring-tones, incoming chime loops,
// call connected, and call ended tones without any external audio files.
// =====================================================

interface ActiveSoundSession {
  stop: () => void;
}

const activeAudioSessions: ActiveSoundSession[] = [];
const activeAudioContexts = new Set<AudioContext>();
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Force-unlocks the browser audio subsystem safely without leaking AudioContext instances
 */
export function unlockAudioSystem(): void {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (err) {
    console.warn('[callAudio] Audio unlock:', err);
  }
}

/**
 * Immediately and unconditionally stops all active loop tones across all contexts
 */
export function stopCallAudio(): void {
  while (activeAudioSessions.length > 0) {
    const session = activeAudioSessions.pop();
    try {
      session?.stop();
    } catch {}
  }
  activeAudioContexts.clear();

  // Shield live WebRTC MediaStream audio and ZEGOCLOUD container elements:
  if (typeof document !== 'undefined') {
    document.querySelectorAll('audio, video').forEach((el: any) => {
      if (el.srcObject) return;
      if (el.closest?.('.zego-uikit-prebuilt') || el.closest?.('[data-zego-call]') || el.closest?.('#zego-call-container')) return;
      if (el.id?.startsWith('zg-') || el.id?.startsWith('zego-')) return;
    });
  }
}

/**
 * Plays the outgoing ringback tone (standard gentle dual-tone 440Hz + 480Hz pulses)
 */
export function playOutgoingRingtone(): () => void {
  stopCallAudio();
  const ctx = getAudioContext();
  if (!ctx) return () => {};
  activeAudioContexts.add(ctx);

  let isPlaying = true;
  let intervalId: any = null;
  const runningOscillators: OscillatorNode[] = [];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const playBurst = () => {
    if (!isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const burstGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(480, now); // B4

      burstGain.gain.setValueAtTime(0.001, now);
      burstGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      burstGain.gain.setValueAtTime(0.08, now + 1.8);
      burstGain.gain.linearRampToValueAtTime(0.001, now + 1.95);

      osc1.connect(burstGain);
      osc2.connect(burstGain);
      burstGain.connect(masterGain);

      runningOscillators.push(osc1, osc2);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);

      const cleanupOscs = () => {
        const i1 = runningOscillators.indexOf(osc1);
        if (i1 !== -1) runningOscillators.splice(i1, 1);
        const i2 = runningOscillators.indexOf(osc2);
        if (i2 !== -1) runningOscillators.splice(i2, 1);
      };
      osc1.onended = cleanupOscs;
    } catch {}
  };

  playBurst();
  intervalId = setInterval(playBurst, 4000);

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    try {
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.disconnect();
    } catch {}
    while (runningOscillators.length > 0) {
      const osc = runningOscillators.pop();
      try {
        osc?.stop();
        osc?.disconnect();
      } catch {}
    }
  };

  const session: ActiveSoundSession = { stop };
  activeAudioSessions.push(session);
  return stop;
}

/**
 * Plays the incoming phone ringtone (Melodic pleasant marimba arpeggio)
 */
export function playIncomingRingtone(): () => void {
  stopCallAudio();
  const ctx = getAudioContext();
  if (!ctx) return () => {};
  activeAudioContexts.add(ctx);

  let isPlaying = true;
  let intervalId: any = null;
  const runningOscillators: OscillatorNode[] = [];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(1, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  const playSequence = () => {
    if (!isPlaying) return;
    try {
      notes.forEach((freq, idx) => {
        if (!isPlaying) return;
        const startTime = ctx.currentTime + idx * 0.14;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        runningOscillators.push(osc);

        osc.start(startTime);
        osc.stop(startTime + 0.3);

        osc.onended = () => {
          const index = runningOscillators.indexOf(osc);
          if (index !== -1) runningOscillators.splice(index, 1);
        };
      });
    } catch {}
  };

  playSequence();
  intervalId = setInterval(playSequence, 2400);

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    try {
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.disconnect();
    } catch {}
    while (runningOscillators.length > 0) {
      const osc = runningOscillators.pop();
      try {
        osc?.stop();
        osc?.disconnect();
      } catch {}
    }
  };

  const session: ActiveSoundSession = { stop };
  activeAudioSessions.push(session);
  return stop;
}

/**
 * Plays a warm rising chime when call connects
 */
export function playCallConnectedSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 523.25, 659.25]; // G4, C5, E5

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  } catch {}
}

/**
 * Plays a double beep when a call ends or is rejected
 */
export function playCallEndedSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const beeps = [0, 0.18];

    beeps.forEach((offset) => {
      const startTime = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, startTime);
      osc.frequency.exponentialRampToValueAtTime(320, startTime + 0.12);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  } catch {}
}
