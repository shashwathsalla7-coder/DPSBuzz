// =====================================================
// DPS BUZZ - Web Audio Call Sound Generator
// Generates authentic outgoing ring-tones, incoming chime loops,
// call connected, and call ended tones without any external audio files.
// =====================================================

let activeRingOscillators: { stop: () => void } | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/**
 * Plays the outgoing ringback tone (standard gentle dual-tone 440Hz + 480Hz pulses)
 */
export function playOutgoingRingtone(): () => void {
  stopCallAudio();
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  let isPlaying = true;
  let intervalId: any = null;

  const playBurst = () => {
    if (!isPlaying) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(480, now); // B4

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.8);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.95);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    } catch {}
  };

  playBurst();
  intervalId = setInterval(playBurst, 4000);

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    try {
      ctx.close();
    } catch {}
  };

  activeRingOscillators = { stop };
  return stop;
}

/**
 * Plays the incoming phone ringtone (Melodic pleasant marimba arpeggio)
 */
export function playIncomingRingtone(): () => void {
  stopCallAudio();
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  let isPlaying = true;
  let intervalId: any = null;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  const playSequence = () => {
    if (!isPlaying) return;
    try {
      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  };

  playSequence();
  intervalId = setInterval(playSequence, 2400);

  const stop = () => {
    isPlaying = false;
    if (intervalId) clearInterval(intervalId);
    try {
      ctx.close();
    } catch {}
  };

  activeRingOscillators = { stop };
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

/**
 * Immediately stops any active loop tones
 */
export function stopCallAudio(): void {
  if (activeRingOscillators) {
    try {
      activeRingOscillators.stop();
    } catch {}
    activeRingOscillators = null;
  }
}
