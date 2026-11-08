'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  Copy,
  Check,
  Shield,
  KeyRound,
  UserCheck,
  Share2,
  QrCode,
  Trash2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Mail,
  Send,
} from 'lucide-react';
import { ChatRoom } from './types';

interface GroupInviteLinkModalProps {
  chat: ChatRoom;
  currentUserUsername: string;
  onClose: () => void;
  onLinkCreated?: (link: any) => void;
}

export const GroupInviteLinkModal: React.FC<GroupInviteLinkModalProps> = ({
  chat,
  currentUserUsername,
  onClose,
  onLinkCreated,
}) => {
  const [roleGranted, setRoleGranted] = useState<'member' | 'admin'>('member');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedWithPass, setCopiedWithPass] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [activeLink, setActiveLink] = useState<{
    id: string;
    inviteCode: string;
    inviteUrl: string;
    roleGranted: string;
    hasPassword: boolean;
    requireApproval: boolean;
    passwordText?: string;
  } | null>(null);

  // Load existing links for this channel
  useEffect(() => {
    const fetchExistingLinks = async () => {
      try {
        const res = await fetch(`/api/campus?action=get_channel_invite_links&channelId=${chat.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.links) && data.links.length > 0) {
            const first = data.links[0];
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            setActiveLink({
              id: first.id,
              inviteCode: first.invite_code,
              inviteUrl: `${baseUrl}/join/${first.invite_code}`,
              roleGranted: first.role_granted || 'member',
              hasPassword: Boolean(first.has_password),
              requireApproval: Boolean(first.require_approval),
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching invite links:', err);
      }
    };
    fetchExistingLinks();
  }, [chat.id]);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite_link',
          channelId: chat.id,
          channelName: chat.name,
          createdBy: currentUserUsername || 'faculty',
          roleGranted,
          password: enablePassword ? password.trim() : '',
          requireApproval,
        }),
      });

      const data = await res.json();
      if (data.success && data.invite) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const created = {
          ...data.invite,
          inviteUrl: `${baseUrl}/join/${data.invite.inviteCode}`,
          passwordText: enablePassword ? password.trim() : undefined,
        };
        setActiveLink(created);
        if (onLinkCreated) onLinkCreated(created);
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (err) {
      alert('Error creating invite link. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    if (!activeLink) return;
    if (!confirm('Are you sure you want to revoke this invite link? Anyone with this link will no longer be able to join.')) return;

    try {
      await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_invite_link',
          linkId: activeLink.id,
        }),
      });
      setActiveLink(null);
      setPassword('');
      setEnablePassword(false);
    } catch (err) {
      alert('Failed to revoke link');
    }
  };

  const copyToClipboard = (text: string, withPass = false) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (withPass) {
        setCopiedWithPass(true);
        setTimeout(() => setCopiedWithPass(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const shareNative = () => {
    if (!activeLink) return;
    const shareText = `Join "${chat.name}" on DPS Buzz Campus Wire: ${activeLink.inviteUrl}${
      activeLink.passwordText ? ` (Password: ${activeLink.passwordText})` : ''
    }`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: chat.name,
        text: shareText,
        url: activeLink.inviteUrl,
      }).catch(() => {});
    } else {
      copyToClipboard(shareText);
    }
  };

  const shareToApp = (platform: 'chat_app' | 'email' | 'sms') => {
    if (!activeLink) return;
    const text = encodeURIComponent(
      `Join "${chat.name}" on DPS Buzz Campus Wire: ${activeLink.inviteUrl}${
        activeLink.passwordText ? ` (Password: ${activeLink.passwordText})` : ''
      }`
    );
    if (platform === 'chat_app') {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent(`Join ${chat.name} Group`)}&body=${text}`);
    } else if (platform === 'sms') {
      window.open(`sms:?body=${text}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-[#161f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#1e293b] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4f46e5]/20 text-[#6366f1]">
              <Link2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Group Invite Link</h3>
              <p className="text-[11px] text-[#94a3b8]">{chat.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Active Link Banner */}
          {activeLink ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94a3b8] flex items-center gap-1.5 font-medium">
                    <Link2 size={13} className="text-[#38bdf8]" />
                    Shareable Invite Link
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      activeLink.roleGranted === 'admin'
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/30'
                        : 'bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30'
                    }`}
                  >
                    {activeLink.roleGranted === 'admin' ? 'Grants Classroom Admin ⭐️' : 'Grants Member Role'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161f2e] border border-white/5 font-mono text-xs text-[#38bdf8] break-all select-all">
                  {activeLink.inviteUrl}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {activeLink.hasPassword && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f59e0b]/15 text-[#fbbf24] border border-[#f59e0b]/30">
                      <KeyRound size={11} />
                      Password Protected
                    </span>
                  )}
                  {activeLink.requireApproval && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30">
                      <UserCheck size={11} />
                      Requires Admin Approval
                    </span>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => copyToClipboard(activeLink.inviteUrl)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-[#34d399]" /> : <Copy size={14} />}
                    <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={shareNative}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Share Anywhere</span>
                  </button>
                </div>

                {activeLink.passwordText && (
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Join "${chat.name}" on DPS Buzz Campus Wire: ${activeLink.inviteUrl}\nGroup Password: ${activeLink.passwordText}`,
                        true
                      )
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#fbbf24] text-xs font-medium border border-[#fbbf24]/20 transition-colors cursor-pointer"
                  >
                    {copiedWithPass ? <Check size={13} /> : <KeyRound size={13} />}
                    <span>{copiedWithPass ? 'Copied with Password!' : `Copy with Password (${activeLink.passwordText})`}</span>
                  </button>
                )}
              </div>

              {/* Share Directly to Apps */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[#94a3b8]">Share via Popular Platforms</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => shareToApp('chat_app')}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-xs text-[var(--text)] border border-white/5 transition-colors cursor-pointer"
                  >
                    <MessageCircle size={14} className="text-[#10b981]" />
                    <span>Direct Chat</span>
                  </button>
                  <button
                    onClick={() => shareToApp('sms')}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-xs text-[var(--text)] border border-white/5 transition-colors cursor-pointer"
                  >
                    <Send size={14} className="text-[#38bdf8]" />
                    <span>SMS</span>
                  </button>
                  <button
                    onClick={() => shareToApp('email')}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--line)] text-xs text-[var(--text)] border border-white/5 transition-colors cursor-pointer"
                  >
                    <Mail size={14} className="text-[#f59e0b]" />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              {/* QR Code Toggle */}
              <div className="pt-1">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1e293b] hover:bg-[#253347] text-xs text-[#94a3b8] hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <QrCode size={15} />
                  <span>{showQr ? 'Hide QR Code' : 'Display QR Code for Classroom Screen'}</span>
                </button>

                {showQr && (
                  <div className="mt-3 p-4 bg-white rounded-xl flex flex-col items-center justify-center text-center animate-fadeIn">
                    {/* Native SVG QR code placeholder */}
                    <div className="w-40 h-40 bg-[#0b0f17] rounded-lg p-2 flex flex-col items-center justify-center text-white">
                      <QrCode size={120} className="text-white" />
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-black font-mono">{activeLink.inviteCode}</div>
                    <div className="text-[10px] text-gray-500">Scan using camera to join directly</div>
                  </div>
                )}
              </div>

              {/* Revoke Option */}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="text-[#94a3b8]">Need a new link or reset security?</span>
                <button
                  onClick={handleRevokeLink}
                  className="flex items-center gap-1 text-[#f87171] hover:text-[#ef4444] transition-colors cursor-pointer font-medium"
                >
                  <Trash2 size={13} />
                  <span>Revoke Link</span>
                </button>
              </div>
            </div>
          ) : (
            /* Link Generator Configuration Form */
            <div className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#94a3b8] flex items-center gap-1.5">
                  <Shield size={14} className="text-[#6366f1]" />
                  Role Granted Upon Joining
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleGranted('member')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      roleGranted === 'member'
                        ? 'bg-[#4f46e5]/15 border-[#4f46e5] text-white shadow-sm'
                        : 'bg-[#1e293b] border-white/5 text-[#94a3b8] hover:bg-[#253347]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>👤 Student Member</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1">Standard classroom participation rights.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleGranted('admin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      roleGranted === 'admin'
                        ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-white shadow-sm'
                        : 'bg-[#1e293b] border-white/5 text-[#94a3b8] hover:bg-[#253347]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#fbbf24] flex items-center gap-1.5">
                      <span>⭐️ Classroom Admin</span>
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1">Full moderation, lock switch & dispatches.</p>
                  </button>
                </div>
              </div>

              {/* Password Protection Toggle */}
              <div className="p-3 rounded-xl bg-[#1e293b] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={15} className="text-[#fbbf24]" />
                    <div>
                      <div className="text-xs font-semibold text-white">Keep Password for Link</div>
                      <div className="text-[10px] text-[#94a3b8]">Only users with this password can enter.</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4f46e5] accent-[#4f46e5] cursor-pointer"
                  />
                </div>

                {enablePassword && (
                  <div className="pt-2 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Enter secret passcode (e.g. DPS2026!)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0f17] border border-white/10 text-xs text-white placeholder-[#94a3b8] outline-none focus:border-[#fbbf24]"
                    />
                  </div>
                )}
              </div>

              {/* Require Approval Toggle */}
              <div className="p-3 rounded-xl bg-[#1e293b] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={15} className="text-[#38bdf8]" />
                  <div>
                    <div className="text-xs font-semibold text-white">Require Admin Approval</div>
                    <div className="text-[10px] text-[#94a3b8]">Users submit request; admins approve before joining.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4f46e5] accent-[#4f46e5] cursor-pointer"
                />
              </div>

              {/* Create Link Submit Button */}
              <button
                onClick={handleGenerateLink}
                disabled={loading || (enablePassword && !password.trim())}
                className="w-full py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Link2 size={15} />
                <span>{loading ? 'Generating Link...' : 'Generate Shareable Invite Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
