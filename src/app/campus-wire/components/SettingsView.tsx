'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Key,
  Lock,
  MessageSquare,
  Bell,
  HardDrive,
  HelpCircle,
  Laptop,
  Check,
  ChevronRight,
  Shield,
  Palette,
  Eye,
  UserX,
  Volume2,
  Trash2,
} from 'lucide-react';
import { SettingsSection } from './types';

interface SettingsViewProps {
  onClose: () => void;
  currentDoodleEnabled: boolean;
  onToggleDoodle: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onClose,
  currentDoodleEnabled,
  onToggleDoodle,
}) => {
  const [section, setSection] = useState<SettingsSection>('main');
  const [readReceipts, setReadReceipts] = useState(true);
  const [enterIsSend, setEnterIsSend] = useState(true);
  const [disappearingDefault, setDisappearingDefault] = useState('Off');
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState('Everyone');
  const [desktopAlerts, setDesktopAlerts] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#111b21] border-r border-[#222d34] overflow-hidden select-none">
      {/* Header with back button */}
      <div className="h-[60px] px-4 flex items-center gap-3 bg-[#202c33] border-b border-[#222d34] shrink-0">
        <button
          onClick={() => {
            if (section === 'main') {
              onClose();
            } else {
              setSection('main');
            }
          }}
          className="p-1.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-base font-semibold text-[#e9edef] capitalize">
          {section === 'main' ? 'Settings' : section.replace('-', ' ')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ================================================================= */}
        {/* MAIN SETTINGS MENU                                                */}
        {/* ================================================================= */}
        {section === 'main' && (
          <div className="divide-y divide-[#222d34]/60">
            {/* User Profile Mini Banner */}
            <div className="p-4 flex items-center gap-3.5 hover:bg-[#202c33] transition-colors cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-[#00a884] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                S
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-[#e9edef]">Shashwath</h2>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  Hey there! I am using DPS Buzz Campus Wire
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => setSection('account')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <Key size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Account</div>
                    <div className="text-xs text-[#8696a0]">Security notifications, change number</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('privacy')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <Lock size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Privacy</div>
                    <div className="text-xs text-[#8696a0]">Block contacts, disappearing messages</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('chats')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <MessageSquare size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Chats</div>
                    <div className="text-xs text-[#8696a0]">Theme, doodle wallpaper, chat history</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('notifications')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <Bell size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Notifications</div>
                    <div className="text-xs text-[#8696a0]">Messages, group & call tones</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('storage')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <HardDrive size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Storage and data</div>
                    <div className="text-xs text-[#8696a0]">Network usage, auto-download</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('linked-devices')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <Laptop size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Linked devices</div>
                    <div className="text-xs text-[#8696a0]">Manage desktop & web sessions</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>

              <button
                onClick={() => setSection('help')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#202c33] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 text-[#e9edef]">
                  <HelpCircle size={19} className="text-[#8696a0]" />
                  <div>
                    <div className="text-sm">Help</div>
                    <div className="text-xs text-[#8696a0]">Help center, privacy policy, license</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#8696a0]" />
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PRIVACY SECTION                                                   */}
        {/* ================================================================= */}
        {section === 'privacy' && (
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00a884]">
                Who can see my personal info
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e9edef]">Last seen and online</div>
                  <div className="text-xs text-[#8696a0]">{lastSeenPrivacy}</div>
                </div>
                <select
                  value={lastSeenPrivacy}
                  onChange={(e) => setLastSeenPrivacy(e.target.value)}
                  className="bg-[#2a3942] text-xs text-[#e9edef] rounded px-2 py-1 outline-none"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="My contacts">My contacts</option>
                  <option value="Nobody">Nobody</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222d34]">
                <div>
                  <div className="text-sm text-[#e9edef]">Read receipts</div>
                  <div className="text-xs text-[#8696a0]">
                    If turned off, you won&apos;t send or receive Read receipts (Blue checks)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                  className="accent-[#00a884] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-2">
              <div className="text-sm text-[#e9edef]">Disappearing messages default timer</div>
              <div className="text-xs text-[#8696a0]">
                Start new chats with disappearing messages set to this duration
              </div>
              <div className="flex gap-2 pt-1">
                {['Off', '24 hours', '7 days', '90 days'].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setDisappearingDefault(dur)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      disappearingDefault === dur
                        ? 'bg-[#00a884] text-[#111b21] font-semibold'
                        : 'bg-[#2a3942] text-[#8696a0] hover:text-white'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* CHATS & WALLPAPER SECTION                                         */}
        {/* ================================================================= */}
        {section === 'chats' && (
          <div className="p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#00a884]">
              Display & Chat Wallpaper
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e9edef]">Add Campus Wire Doodle to wallpaper</div>
                  <div className="text-xs text-[#8696a0]">
                    Display authentic Campus Wire hand-drawn doodle pattern
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentDoodleEnabled}
                  onChange={(e) => onToggleDoodle(e.target.checked)}
                  className="accent-[#00a884] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222d34]">
                <div>
                  <div className="text-sm text-[#e9edef]">Enter is send</div>
                  <div className="text-xs text-[#8696a0]">
                    Enter key will send your message; Shift+Enter for new line
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enterIsSend}
                  onChange={(e) => setEnterIsSend(e.target.checked)}
                  className="accent-[#00a884] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33]">
              <div className="text-sm text-[#e9edef] mb-1">Theme</div>
              <div className="text-xs text-[#8696a0] mb-2">Windows Dark (System Default)</div>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-[#00a884]/20 text-[#00a884] font-medium">
                Active: Dark Segoe UI
              </span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* NOTIFICATIONS SECTION                                             */}
        {/* ================================================================= */}
        {section === 'notifications' && (
          <div className="p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#00a884]">
              Desktop Alerts
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#e9edef]">Desktop notifications</div>
                  <div className="text-xs text-[#8696a0]">Show notifications for new messages</div>
                </div>
                <input
                  type="checkbox"
                  checked={desktopAlerts}
                  onChange={(e) => setDesktopAlerts(e.target.checked)}
                  className="accent-[#00a884] w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222d34]">
                <div>
                  <div className="text-sm text-[#e9edef]">Notification tones</div>
                  <div className="text-xs text-[#8696a0]">Play sound for incoming messages</div>
                </div>
                <Volume2 size={16} className="text-[#00a884]" />
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* LINKED DEVICES SECTION                                            */}
        {/* ================================================================= */}
        {section === 'linked-devices' && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-xl bg-[#202c33] text-center flex flex-col items-center">
              <Laptop size={36} className="text-[#00a884] mb-2" />
              <div className="text-sm font-semibold text-[#e9edef]">Windows Desktop Client</div>
              <div className="text-xs text-[#8696a0] mt-1">
                Active session • Connected via DPS Buzz Campus Intranet
              </div>
              <span className="mt-3 px-3 py-1 rounded-full text-xs font-medium bg-[#00a884]/20 text-[#00a884]">
                End-to-End Encrypted
              </span>
            </div>

            <div className="text-xs text-[#8696a0] text-center px-4">
              Your personal messages and calls are secured with end-to-end encryption.
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* HELP SECTION                                                      */}
        {/* ================================================================= */}
        {section === 'help' && (
          <div className="p-4 space-y-3">
            <div className="p-3 rounded-lg bg-[#202c33]">
              <div className="text-sm font-semibold text-[#e9edef]">DPS Buzz Campus Wire OS</div>
              <div className="text-xs text-[#8696a0] mt-1">
                Version 2.24.12 Desktop Native Build • Powered by Next.js 16 &amp; Cloudflare D1
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] text-xs text-[#8696a0] leading-relaxed">
              Clean-room replica built using the Replica Skill suite for Delhi Public School student &amp; faculty collaboration.
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ACCOUNT SECTION                                                   */}
        {/* ================================================================= */}
        {section === 'account' && (
          <div className="p-4 space-y-3">
            <div className="p-3 rounded-lg bg-[#202c33] space-y-2">
              <div className="text-sm text-[#e9edef]">Security notifications</div>
              <div className="text-xs text-[#8696a0]">
                Get notified when your security code changes for a contact
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-2">
              <div className="text-sm text-[#e9edef]">Two-step verification</div>
              <div className="text-xs text-[#8696a0]">Enabled with DPS Buzz Student PIN</div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STORAGE SECTION                                                   */}
        {/* ================================================================= */}
        {section === 'storage' && (
          <div className="p-4 space-y-3">
            <div className="p-3 rounded-lg bg-[#202c33] space-y-1">
              <div className="text-sm text-[#e9edef]">Network usage</div>
              <div className="text-xs text-[#8696a0]">14.2 MB sent • 84.8 MB received</div>
            </div>

            <div className="p-3 rounded-lg bg-[#202c33] space-y-1">
              <div className="text-sm text-[#e9edef]">Auto-download media</div>
              <div className="text-xs text-[#8696a0]">Photos, Audio, Videos on Wi-Fi</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
