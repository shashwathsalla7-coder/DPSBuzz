// =====================================================
// Global Audio Player Controller for 30s Legal Song Previews
// Ensures only one song preview plays at a time across the entire app
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

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'none';

    this.audio.addEventListener('ended', () => {
      this.stopProgress();
      this.notify(false, 0, 0);
    });

    this.audio.addEventListener('pause', () => {
      this.stopProgress();
      this.notify(false, this.getProgress(), this.audio?.currentTime || 0);
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error:', e);
      this.stopProgress();
      this.notify(false, 0, 0);
    });
  }

  private startProgress() {
    this.stopProgress();
    this.progressInterval = setInterval(() => {
      if (this.audio && !this.audio.paused) {
        if (this.currentTrack?.clipDuration && this.currentTrack.startTime !== undefined) {
          const maxTime = (this.currentTrack.startTime || 0) + this.currentTrack.clipDuration;
          if (this.audio.currentTime >= maxTime) {
            this.audio.currentTime = this.currentTrack.startTime || 0;
          }
        }
        this.notify(true, this.getProgress(), this.audio.currentTime);
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
    if (!this.audio || !this.audio.duration || isNaN(this.audio.duration)) return 0;
    return Math.min(this.audio.currentTime / this.audio.duration, 1);
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
    this.listeners.forEach((fn) => fn(state));
  }

  public playTrack(track: SongTrack) {
    if (typeof window === 'undefined') return;
    this.initAudio();
    if (!this.audio) return;

    const startAt = track.startTime || 0;

    if (this.currentTrack?.id === track.id && this.audio && !this.audio.paused) {
      if (track.startTime !== undefined && Math.abs(this.audio.currentTime - startAt) > 1) {
        this.currentTrack = track;
        this.audio.currentTime = startAt;
      }
      return; // Already playing this track
    }

    this.currentTrack = track;
    this.audio.src = track.previewUrl;
    this.audio.currentTime = startAt;
    this.audio.play()
      .then(() => {
        this.startProgress();
        this.notify(true, this.getProgress(), this.audio?.currentTime || startAt);
      })
      .catch((err) => {
        console.warn('Playback failed (autoplay policy or network):', err);
        this.notify(false, 0, 0);
      });
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

    if (this.audio.src !== track.previewUrl) {
      this.audio.src = track.previewUrl;
    }
    this.audio.currentTime = startSeconds;
    this.audio.play()
      .then(() => {
        this.startProgress();
        this.notify(true, this.getProgress(), startSeconds);
      })
      .catch((err) => {
        console.warn('Playback failed:', err);
        this.notify(false, 0, 0);
      });
  }

  public pauseTrack() {
    if (!this.audio) return;
    this.audio.pause();
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
    this.audio.currentTime = target;
    this.notify(!this.audio.paused, progress, target);
  }

  public seekSeconds(seconds: number) {
    if (!this.audio) return;
    const target = Math.max(0, Math.min(seconds, 30));
    this.audio.currentTime = target;
    const duration = (this.audio.duration && !isNaN(this.audio.duration)) ? this.audio.duration : 30;
    this.notify(!this.audio.paused, Math.min(target / duration, 1), target);
  }

  public stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.stopProgress();
    this.currentTrack = null;
    this.notify(false, 0, 0);
  }
}

export const globalAudio = new AudioManager();
