'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic, Radio } from 'lucide-react';

interface VoiceRecorderBarProps {
  onCancel: () => void;
  onSendVoiceNote: (audioUrl: string, duration: string) => void;
}

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  onCancel,
  onSendVoiceNote,
}) => {
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // Request microphone access
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream;
          try {
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            recorder.start(100);
          } catch {
            // MediaRecorder format fallback
          }
        })
        .catch(() => {
          // Microphones blocked or unavailable in headless/sandbox environment
        });
    }

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleStopAndSend = () => {
    const durationStr = formatTime(seconds || 1);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendVoiceNote(base64Audio, durationStr);
        };
        reader.readAsDataURL(audioBlob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      // Synthetic fallback
      onSendVoiceNote('', durationStr);
    }
  };

  const handleDiscard = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  return (
    <div className="h-[62px] px-3 sm:px-4 flex items-center justify-between bg-[var(--surface)] border-t border-[var(--line)] animate-fadeIn">
      {/* Trash / Cancel Button */}
      <button
        type="button"
        onClick={handleDiscard}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#ea4335] hover:bg-[var(--line)] transition-colors cursor-pointer active:scale-90 shrink-0"
        title="Discard voice recording"
      >
        <Trash2 size={20} />
      </button>

      {/* Center Recording Indicators */}
      <div className="flex-1 flex items-center justify-center gap-3">
        {/* Blinking red recording dot */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ea4335] animate-ping" />
          <span className="font-mono text-sm font-semibold text-[var(--text)]">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Live Audio Waves Simulation */}
        <div className="hidden sm:flex items-center gap-1 h-5">
          {[40, 75, 90, 60, 100, 70, 50, 85, 95, 60, 45, 80].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-[var(--primary)] animate-pulse"
              style={{
                height: `${Math.max(25, (h * (0.5 + Math.sin(seconds * 4 + i) * 0.5)))}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>

        <span className="text-xs text-[var(--text-muted)] font-medium hidden md:inline">
          Recording voice note...
        </span>
      </div>

      {/* Send Voice Note Button */}
      <button
        type="button"
        onClick={handleStopAndSend}
        className="w-11 h-11 rounded-full text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all cursor-pointer flex items-center justify-center shadow-lg active:scale-95 shrink-0"
        title="Send voice note"
      >
        <Send size={18} />
      </button>
    </div>
  );
};
