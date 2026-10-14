// =====================================================
// Global Audio Player Controller for 30s Legal Song Previews
// Ensures only one song preview plays at a time across the entire app
// Handles safe seeking, iOS/Android WebView autoplay policies & loadedmetadata state
// =====================================================

import { SongTrack } from './dataStore';

type AudioListener = (state: AudioPlayerState) => void;

export interface AudioPlayerState {
  currentTrack: SongTrack | null;
  isPlaying: boolean;
  progress: number; // 0 to 1
  currentTime: number;
}

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: SongTrack | null = null;
  private listeners: Set<AudioListener> = new Set();
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private isSeeking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    try {
      this.audio = new Audio();
      this.audio.preload = 'auto';

      this.audio.addEventListener('ended', () => {
        this.stopProgress();
        this.notify(false, 0, 0);
      });

      this.audio.addEventListener('pause', () => {
        if (!this.isSeeking) {
          this.stopProgress();
          this.notify(false, this.getProgress(), this.audio?.currentTime || 0);
        }
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio playback error (handled):', e);
        this.stopProgress();
        this.notify(false, 0, 0);
      });
    } catch (err) {
      console.warn('Audio initialization exception:', err);
    }
  }

  private safeSetCurrentTime(time: number) {
    if (!this.audio) return;
    const safeTime = Math.max(0, time);

    const applyTime = () => {
      try {
        if (this.audio && !isNaN(this.audio.duration) && isFinite(this.audio.duration)) {
          this.audio.currentTime = Math.min(safeTime, this.audio.duration - 0.2);
        } else if (this.audio) {
          this.audio.currentTime = safeTime;
        }
      } catch (err) {
        console.warn('safeSetCurrentTime handled error:', err);
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
        if (this.currentTrack?.clipDuration && this.currentTrack.startTime !== undefined) {
          const maxTime = (this.currentTrack.startTime || 0) + this.currentTrack.clipDuration;
          if (cur >= maxTime) {
            this.safeSetCurrentTime(this.currentTrack.startTime || 0);
          }
        }
        this.notify(true, this.getProgress(), cur);
      }
    }, 200);
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
    // Send immediate state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AudioPlayerState {
    const isPlaying = !!(this.audio && !this.audio.paused && !this.audio.ended);
    return {
      currentTrack: this.currentTrack,
      isPlaying,
      progress: this.getProgress(),
      currentTime: this.audio?.currentTime || 0,
    };
  }

  private notify(isPlaying: boolean, progress: number, currentTime: number) {
    const state: AudioPlayerState = {
      currentTrack: this.currentTrack,
      isPlaying,
      progress,
      currentTime,
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

    const startAt = track.startTime || 0;
    const isSameTrack = this.currentTrack?.id === track.id;

    if (isSameTrack && !this.audio.paused) {
      if (track.startTime !== undefined && Math.abs(this.audio.currentTime - startAt) > 1) {
        this.currentTrack = track;
        this.safeSetCurrentTime(startAt);
      }
      return; // Already playing this track
    }

    this.currentTrack = track;

    // Only update src if it differs
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
          // Benign warning: user gesture policy or rapid toggle
          console.warn('Playback play() promise handled:', err.name);
          this.notify(false, 0, 0);
        });
    }
  }

  public previewSegment(track: SongTrack, startSeconds: number, duration: number = 15) {
    if (typeof window === 'undefined') return;
    this.initAudio();
    if (!this.audio) return;

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

  public seek(progress: number) {
    if (!this.audio || !this.audio.duration || isNaN(this.audio.duration)) return;
    const target = Math.max(0, Math.min(progress, 1)) * this.audio.duration;
    this.safeSetCurrentTime(target);
    this.notify(!this.audio.paused, progress, target);
  }

  public seekSeconds(seconds: number) {
    if (!this.audio) return;
    const target = Math.max(0, Math.min(seconds, 30));
    this.safeSetCurrentTime(target);
    const duration = (this.audio.duration && !isNaN(this.audio.duration)) ? this.audio.duration : 30;
    this.notify(!this.audio.paused, Math.min(target / duration, 1), target);
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
