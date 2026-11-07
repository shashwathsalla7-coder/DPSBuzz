'use client';

import React, { useState } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';

interface PhotoAttachmentModalProps {
  imageSrc: string;
  onClose: () => void;
  onSend: (caption: string) => void;
}

export const PhotoAttachmentModal: React.FC<PhotoAttachmentModalProps> = ({
  imageSrc,
  onClose,
  onSend,
}) => {
  const [caption, setCaption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(caption.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between text-white z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer text-white"
          title="Cancel"
        >
          <X size={24} />
        </button>
        <span className="text-sm font-semibold text-[#e9edef] flex items-center gap-1.5">
          <ImageIcon size={18} className="text-[#00a884]" />
          <span>Send Photo Attachment</span>
        </span>
        <div className="w-10" />
      </div>

      {/* Photo Preview Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt="Preview"
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
        />
      </div>

      {/* Caption & Send Bar */}
      <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto flex items-center gap-2 pt-3 z-10">
        <div className="flex-1 rounded-2xl px-4 py-3 bg-[#2a3942] border border-[#222d34]">
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            autoFocus
            className="w-full text-sm text-[#e9edef] bg-transparent focus:outline-none placeholder-[#8696a0]"
          />
        </div>

        <button
          type="submit"
          className="w-12 h-12 rounded-full text-white bg-[#00a884] hover:bg-[#008f6f] transition-all cursor-pointer flex items-center justify-center shadow-xl active:scale-95 shrink-0"
          title="Send Photo"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
