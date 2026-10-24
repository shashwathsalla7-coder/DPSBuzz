// =====================================================
// Global Audio Player Controller for Legal Song Clips
// Ensures only one song clip plays at a time across the entire app
// Handles seamless segment looping, iOS Safari / Android WebView unlock,
// and immediate stop when page is hidden or route changes
// =====================================================

import { SongTrack } from './dataStore';

type AudioListener = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  currentTrack: SongTrack | null;
  isPlaying: boolean;
  progress: number; // 0 to 1
  currentTime: number;
  isUnavailable?: boolean;
}

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: SongTrack | null = null;
  private listeners: Set<AudioListener> = new Set();
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private isSeeking: boolean = false;
  private isUnavailable: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
      this.setupLifecycleListeners();
    }
  }

  private initAudio() {
    if (this.audio) return;
    try {
      this.audio = new Audio();
      this.audio.preload = 'metadata'; // HTTP range requests - only loads requested clip, saving mobile data
      this.audio.crossOrigin = 'anonymous';
      this.audio.volume = 1.0;
      this.audio.muted = false;

      this.audio.addEventListener('ended', () => {
        // If track has a clip segment, loop back to start
        if (this.currentTrack?.startTime !== undefined) {
          this.safeSetCurrentTime(this.currentTrack.startTime);
          this.audio?.play().catch(() => {});
        } else {
          this.stopProgress();
          this.notify(false, 0, 0);
        }
      });

      this.audio.addEventListener('pause', () => {
        if (!this.isSeeking) {
          this.stopProgress();
          this.notify(false, this.getProgress(), this.audio?.currentTime || 0);
        }
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio playback error (handled gracefully):', e);
        this.isUnavailable = true;
        this.stopProgress();
        this.notify(false, 0, 0);
      });
    } catch (err) {
      console.warn('Audio initialization exception:', err);
    }
  }

  private setupLifecycleListeners() {
    if (typeof window === 'undefined') return;

    // Immediately stop audio when user switches tabs or locks phone screen
    const handleVisibilityChange = () => {
      if (document.hidden && this.audio && !this.audio.paused) {
        this.pauseTrack();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Stop audio on page unload / page hide
    window.addEventListener('pagehide', () => this.stop());

    // One-time unlock listener on first user touch across the screen
    const unlockOnce = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('touchstart', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    window.addEventListener('touchstart', unlockOnce, { once: true, passive: true });
  }

  public unlockAudio() {
    if (typeof window === 'undefined' || this.isUnlocked) return;
    this.initAudio();
    if (!this.audio) return;
    try {
      this.audio.volume = 1.0;
      this.audio.muted = false;
      // Pre-warm audio element on direct user gesture with tiny silent buffer
      if (this.audio.paused && (!this.audio.src || this.audio.src.startsWith('data:'))) {
        this.audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.audio
          .play()
          .then(() => {
            this.audio?.pause();
            this.isUnlocked = true;
          })
          .catch(() => {});
      }
    } catch {}
  }

  public setMuted(muted: boolean) {
    if (!this.audio) return;
    try {
      this.audio.muted = muted;
      this.audio.volume = muted ? 0 : 1.0;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dpsbuzz_music_muted', muted ? 'true' : 'false');
        } catch {}
      }
    } catch {}
  }

  public getSavedMuteState(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('dpsbuzz_music_muted') === 'true';
    } catch {
      return false;
    }
  }

  private safeSetCurrentTime(time: number) {
    if (!this.audio) return;
    const safeTime = Math.max(0, time);

    const applyTime = () => {
      try {
        if (this.audio && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
          this.audio.currentTime = Math.min(safeTime, this.audio.duration - 0.1);
        } else if (this.audio) {
          this.audio.currentTime = safeTime;
        }
      } catch (err) {
        console.warn('safeSetCurrentTime handled:', err);
      }
    };

    if (this.audio.readyState >= 1) {
      applyTime();
    } else {
      this.audio.addEventListener('loadedmetadata', applyTime, { once: true });
    }
  }

  private startProgress() {
    this.stopProgress();
    this.progressInterval = setInterval(() => {
      if (this.audio && !this.audio.paused) {
        const cur = this.audio.currentTime || 0;
        const start = this.currentTrack?.startTime || 0;
        const clipLen = this.currentTrack?.clipDuration || 30;
        const maxTime = start + clipLen;

        // Seamless loop back to clip start point
        if (cur >= maxTime) {
          this.safeSetCurrentTime(start);
        }
        this.notify(true, this.getProgress(), cur);
      }
    }, 120);
  }

  private stopProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private getProgress(): number {
    if (!this.audio || !this.audio.duration || isNaN(this.audio.duration) || this.audio.duration === 0) return 0;
    return Math.min(Math.max(this.audio.currentTime / this.audio.duration, 0), 1);
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AudioPlayerState {
    const isPlaying = !!(this.audio && !this.audio.paused && !this.audio.ended && !this.isUnavailable);
    return {
      currentTrack: this.currentTrack,
      isPlaying,
      progress: this.getProgress(),
      currentTime: this.audio?.currentTime || 0,
      isUnavailable: this.isUnavailable,
    };
  }

  private notify(isPlaying: boolean, progress: number, currentTime: number) {
    const state: AudioPlayerState = {
      currentTrack: this.currentTrack,
      isPlaying,
      progress,
      currentTime,
      isUnavailable: this.isUnavailable,
    };
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {
        console.warn('Listener error in audioManager:', e);
      }
    });
  }

  public playTrack(track: SongTrack) {
    if (typeof window === 'undefined') return;
    this.initAudio();
    if (!this.audio) return;

    this.isUnavailable = false;
    const startAt = track.startTime || 0;
    const isSameTrack = this.currentTrack?.id === track.id;

    if (isSameTrack && !this.audio.paused) {
      if (track.startTime !== undefined && Math.abs(this.audio.currentTime - startAt) > 1) {
        this.currentTrack = track;
        this.safeSetCurrentTime(startAt);
      }
      return;
    }

    this.currentTrack = track;

    const currentSrc = this.audio.src || '';
    if (!currentSrc.includes(track.previewUrl)) {
      this.audio.src = track.previewUrl;
      this.audio.load();
    }

    this.safeSetCurrentTime(startAt);

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.startProgress();
          this.notify(true, this.getProgress(), this.audio?.currentTime || startAt);
        })
        .catch((err) => {
          console.warn('Playback play() promise handled (autoplay policy):', err.name);
          this.notify(false, 0, 0);

          // Retry automatically on next tap
          const resumeOnGesture = () => {
            if (this.audio && this.currentTrack?.id === track.id) {
              this.audio.play().then(() => {
                this.startProgress();
                this.notify(true, this.getProgress(), this.audio?.currentTime || startAt);
              }).catch(() => {});
            }
            window.removeEventListener('pointerdown', resumeOnGesture);
            window.removeEventListener('touchstart', resumeOnGesture);
          };
          window.addEventListener('pointerdown', resumeOnGesture, { once: true });
          window.addEventListener('touchstart', resumeOnGesture, { once: true });
        });
    }
  }

  public previewSegment(track: SongTrack, startSeconds: number, duration: number = 15) {
    if (typeof window === 'undefined') return;
    this.initAudio();
    if (!this.audio) return;

    this.isUnavailable = false;
    const segmentTrack: SongTrack = {
      ...track,
      startTime: startSeconds,
      clipDuration: duration,
    };
    this.currentTrack = segmentTrack;

    const currentSrc = this.audio.src || '';
    const needsNewSrc = !currentSrc.includes(track.previewUrl);

    if (needsNewSrc) {
      this.audio.src = track.previewUrl;
      this.audio.load();
    }

    this.safeSetCurrentTime(startSeconds);

    if (this.audio.paused) {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.startProgress();
            this.notify(true, this.getProgress(), startSeconds);
          })
          .catch((err) => {
            console.warn('previewSegment play() handled:', err.name);
            this.notify(false, 0, 0);
          });
      }
    } else {
      this.startProgress();
      this.notify(true, this.getProgress(), startSeconds);
    }
  }

  public pauseTrack() {
    if (!this.audio) return;
    try {
      this.audio.pause();
    } catch (e) {
      console.warn('pauseTrack error:', e);
    }
    this.stopProgress();
    this.notify(false, this.getProgress(), this.audio.currentTime);
  }

  public toggleTrack(track: SongTrack) {
    if (this.currentTrack?.id === track.id && this.audio && !this.audio.paused) {
      this.pauseTrack();
    } else {
      this.playTrack(track);
    }
  }

  public seekSeconds(seconds: number) {
    if (!this.audio) return;
    const maxDur =
      this.audio.duration && !isNaN(this.audio.duration) && isFinite(this.audio.duration)
        ? this.audio.duration
        : this.currentTrack?.durationSeconds || 300;
    const target = Math.max(0, Math.min(seconds, maxDur));
    this.safeSetCurrentTime(target);
    const duration = this.audio.duration && !isNaN(this.audio.duration) ? this.audio.duration : maxDur;
    this.notify(!this.audio.paused, Math.min(target / duration, 1), target);
  }

  public getAudioDuration(): number {
    if (!this.audio || isNaN(this.audio.duration) || !isFinite(this.audio.duration)) return 0;
    return this.audio.duration;
  }

  public stop() {
    if (!this.audio) return;
    try {
      this.audio.pause();
      this.safeSetCurrentTime(0);
    } catch {}
    this.stopProgress();
    this.currentTrack = null;
    this.notify(false, 0, 0);
  }
}

export const globalAudio = new AudioManager();
