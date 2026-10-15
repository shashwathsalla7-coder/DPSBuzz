'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCheck, UserPlus, Users, Check, X, Shield, Sparkles } from 'lucide-react';
import { DataStore, type NotificationItem, type GroupJoinRequest } from '@/lib/dataStore';
import { getAvatarColorPair } from '@/config/tokens';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [groupRequests, setGroupRequests] = useState<GroupJoinRequest[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUser = useMemo(() => DataStore.getCurrentUser(), []);

  const loadAll = () => {
    const currentClean = (currentUser?.username || '').toLowerCase().trim();
    const rawList = DataStore.getNotifications();
    const list = rawList.filter(
      (n) => !n.userId || n.userId === 'all' || n.userId.toLowerCase().trim() === currentClean
    );
    setNotifications(list || []);

    setGroupRequests(DataStore.getGroupJoinRequests().filter((r) => r.status === 'pending'));
    setFollowRequests(
      DataStore.getFollowRequests().filter(
        (f) => f.target.toLowerCase() === currentUser.username.toLowerCase()
      )
    );
  };

  useEffect(() => {
    loadAll();
    const handleUpdate = () => loadAll();
    window.addEventListener('dpsbuzz:content_updated', handleUpdate);
    return () => window.removeEventListener('dpsbuzz:content_updated', handleUpdate);
  }, [currentUser.username]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      DataStore.markAllNotificationsRead(currentUser?.username);
    } catch {}
  };

  const handleAcceptGroupReq = (req: GroupJoinRequest) => {
    DataStore.acceptGroupJoinRequest(req.id, currentUser.username);
    setGroupRequests((prev) => prev.filter((r) => r.id !== req.id));
    showToast(`Accepted ${req.fullName} into ${req.groupName}! 🎉`);
  };

  const handleDeclineGroupReq = (req: GroupJoinRequest) => {
    // mark declined
    const list = DataStore.getGroupJoinRequests();
    const target = list.find((r) => r.id === req.id);
    if (target) {
      target.status = 'declined';
      localStorage.setItem('dpsbuzz_group_join_requests_v1', JSON.stringify(list));
    }
    setGroupRequests((prev) => prev.filter((r) => r.id !== req.id));
    showToast(`Declined request for ${req.groupName}`);
  };

  const handleAcceptFollowReq = (req: any) => {
    DataStore.acceptFollowRequest(currentUser.username, req.requester);
    setFollowRequests((prev) => prev.filter((f) => f.requester !== req.requester));
    showToast(`Accepted follow request from @${req.requester}! ✨`);
  };

  const handleDeclineFollowReq = (req: any) => {
    DataStore.cancelFollowRequest(req.requester, currentUser.username);
    setFollowRequests((prev) => prev.filter((f) => f.requester !== req.requester));
    showToast(`Declined follow request from @${req.requester}`);
  };

  const todayNotifs = notifications.filter((n) => n.timeAgo.includes('h') || n.timeAgo.includes('m') || n.timeAgo === 'Just now');
  const earlierNotifs = notifications.filter((n) => !todayNotifs.includes(n));

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    try {
      DataStore.markNotificationRead(notif.id);
    } catch {}
  };

  const renderNotificationRow = (notif: NotificationItem) => {
    const pair = getAvatarColorPair(notif.userId);
    const rowContent = (
      <div
        key={notif.id}
        onClick={() => handleNotificationClick(notif)}
        className={`px-4 py-3 border-b last:border-b-0 flex items-center justify-between transition-colors ${
          notif.link ? 'cursor-pointer hover:bg-[var(--surface-sunken)]' : ''
        }`}
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 relative"
            style={{ backgroundColor: pair.bg, color: pair.text }}
          >
            {notif.userId.slice(0, 2).toUpperCase()}
            {notif.type === 'chat' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] shadow-xs">
                💬
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs leading-snug truncate" style={{ color: 'var(--text)' }}>
              <span className="font-bold">{notif.title}</span>
            </p>
            {notif.body && (
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                {notif.body}
              </p>
            )}
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {notif.timeAgo.includes('ago') || notif.timeAgo === 'Just now' ? notif.timeAgo : `${notif.timeAgo} ago`}
            </span>
          </div>
        </div>

        {!notif.isRead && (
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 ml-2 animate-pulse-glow"
            style={{ backgroundColor: 'var(--primary)' }}
          />
        )}
      </div>
    );

    if (notif.link) {
      return (
        <Link key={notif.id} href={notif.link} className="block">
          {rowContent}
        </Link>
      );
    }
    return rowContent;
  };

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Mobile Bar */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/home" className="w-9 h-9 rounded-xl flex items-center justify-center btn-press" style={{ color: 'var(--text)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1
            className="text-lg font-bold tracking-[-0.02em] leading-[1.15]"
            style={{
              fontFamily: "var(--font-cabinet), 'Cabinet Grotesk', sans-serif",
              color: 'var(--text)',
            }}
          >
            Notifications
          </h1>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-xs font-semibold hover:underline btn-press cursor-pointer"
          style={{ color: 'var(--primary)' }}
        >
          Mark all read
        </button>
      </div>

      <div className="p-4 max-w-[480px] mx-auto space-y-4">
        {/* Pending Requests Section (Follow Requests + Team/Group Join Requests) */}
        {(groupRequests.length > 0 || followRequests.length > 0) && (
          <div className="space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <UserPlus size={13} className="text-pink-500" />
                <span>Pending Requests</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-500 border border-pink-500/20">
                {groupRequests.length + followRequests.length} pending
              </span>
            </div>

            <div
              className="rounded-2xl border divide-y overflow-hidden"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--line)',
              }}
            >
              {/* Follow Requests */}
              {followRequests.map((freq) => {
                const pair = getAvatarColorPair(freq.requester);
                return (
                  <div
                    key={`freq-${freq.requester}`}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: pair.bg, color: pair.text }}
                      >
                        {freq.requester.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                          @{freq.requester}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          Requested to follow your profile
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAcceptFollowReq(freq)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white gradient-bg shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>Confirm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineFollowReq(freq)}
                        className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-rose-500 transition-colors cursor-pointer"
                        aria-label="Decline request"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Group / Team Join Requests */}
              {groupRequests.map((greq) => {
                const pair = getAvatarColorPair(greq.username);
                return (
                  <div
                    key={greq.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {greq.avatar ? (
                        <img
                          src={greq.avatar}
                          alt={greq.fullName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--line)]"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: pair.bg, color: pair.text }}
                        >
                          {greq.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                          {greq.fullName}{' '}
                          <span className="text-[var(--text-muted)] font-normal">
                            wants to join
                          </span>{' '}
                          <span className="text-pink-500">{greq.groupName}</span>
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {greq.studentClass || 'Classmate'} • {greq.requestedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAcceptGroupReq(greq)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white gradient-bg shadow-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeclineGroupReq(greq)}
                        className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-rose-500 transition-colors cursor-pointer"
                        aria-label="Decline request"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notifications.length === 0 && groupRequests.length === 0 && followRequests.length === 0 ? (
          /* Empty Notifications Copy (DESIGN.md Section 11) */
          <div
            className="p-8 rounded-2xl border text-center space-y-2"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--line)',
            }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Nothing new.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              When classmates like your post or leave a comment, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grouped as Today (DESIGN.md Section 10) */}
            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
                  Today
                </div>
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                  }}
                >
                  {todayNotifs.map(renderNotificationRow)}
                </div>
              </div>
            )}

            {/* Grouped as Earlier */}
            {earlierNotifs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
                  Earlier
                </div>
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--line)',
                  }}
                >
                  {earlierNotifs.map(renderNotificationRow)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-fade-in">
          <div
            className="px-4 py-2 text-xs font-bold text-white shadow-xl flex items-center gap-2 rounded-full"
            style={{ backgroundColor: '#17181C', border: '1px solid #333' }}
          >
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
