'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from 'lucide-react';

interface ActiveCallOverlayProps {
  contactName: string;
  callType: 'voice' | 'video';
  onEndCall: () => void;
}

export const ActiveCallOverlay: React.FC<ActiveCallOverlayProps> = ({
  contactName,
  callType,
  onEndCall,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [status, setStatus] = useState<'Ringing...' | 'Connected'>('Ringing...');

  useEffect(() => {
    const ringTimeout = setTimeout(() => {
      setStatus('Connected');
    }, 2500);

    return () => clearTimeout(ringTimeout);
  }, []);

  useEffect(() => {
    if (status !== 'Connected') return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="w-full max-w-lg h-[480px] bg-[var(--bg)] rounded-2xl border border-[var(--line)] flex flex-col justify-between p-6 shadow-2xl relative overflow-hidden">
        {/* Background ambient gradient */}
        <div className="absolute inset-0 bg-radial from-[var(--accent-cta)]/20 via-transparent to-transparent pointer-events-none" />

        {/* Top bar info */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] z-10">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--primary)]" />
            <span>Private call</span>
          </div>
          <span className="capitalize font-medium text-[var(--text)] bg-[var(--surface)] px-2.5 py-1 rounded-full">
            {callType} Call
          </span>
        </div>

        {/* Center contact representation */}
        <div className="flex flex-col items-center justify-center text-center my-auto z-10">
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-[var(--primary)] text-white font-bold text-3xl flex items-center justify-center shadow-xl ring-4 ring-[var(--primary)]/30 animate-pulse">
              {contactName.slice(0, 1).toUpperCase()}
            </div>
          </div>

          <h3 className="text-xl font-semibold text-[var(--text)]">{contactName}</h3>

          <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">
            {status === 'Connected' ? formatDuration(seconds) : status}
          </p>
        </div>

        {/* Controls footer */}
        <div className="flex items-center justify-center gap-4 z-10 pt-4 border-t border-[var(--line)]/60">
          {/* Mute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? 'bg-[#ea4335] text-white' : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--line)]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-[#ea4335] text-white hover:bg-[#d01020] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff size={24} />
          </button>

          {/* Video Toggle button */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoOff ? 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--line)]' : 'bg-[var(--primary)] text-white'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
